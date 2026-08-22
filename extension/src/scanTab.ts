/**
 * Scan d'un onglet, depuis l'extension.
 *
 * L'extension ne décide de rien : elle récolte, agrège avec le moteur partagé,
 * et produit exactement le rapport que la CLI produit. Toute la décision —
 * validation, tri par certitude, écriture — reste dans l'application.
 *
 * Rien ne sort du poste : aucune requête réseau n'est faite ici.
 */
import type { BasketEntry, ExtensionReport } from './basket.ts';
import { probeDocument } from '../../src/scan/collect.ts';
import { mergePageScan } from '../../src/scan/mergeFrames.ts';
import {
  AXE_RULES,
  FOUND_SELECTORS,
  MAIN_FRAME_FAIL_SELECTORS,
  NA_SELECTORS,
} from '../../src/scan/rgaaMapping.ts';
import type { FrameScan, ProbeResult } from '../../src/scan/types.ts';

const SNIPPET_MAX = 200;
const NODES_PER_SELECTOR = 5;

/**
 * Exécuté dans chaque cadre de la page.
 *
 * Injecté par `executeScript`, donc sérialisé par `toString()` : la fonction se
 * suffit à elle-même. `iframes: false` coupe la mécanique inter-cadres d'axe —
 * chaque cadre est déjà visité, et les résultats sont réunis par `mergePageScan`.
 */
async function runAxe(rules: string[], within: string | null) {
  const axe = (globalThis as unknown as { axe?: typeof import('axe-core') }).axe;
  if (!axe) return null;

  const context = within === null ? document : document.querySelector(within);
  if (!context) return null;

  const results = await axe.run(context, { runOnly: { type: 'rule', values: rules }, iframes: false });
  const nodesOf = (rule: { nodes: Array<{ target: unknown[]; html: string }> }) =>
    rule.nodes.map(node => ({ selector: node.target.join(' '), snippet: node.html.slice(0, 200) }));

  return {
    version: results.testEngine.version,
    violations: results.violations.map(rule => ({ id: rule.id, nodes: nodesOf(rule) })),
    incomplete: results.incomplete.map(rule => ({ id: rule.id, nodes: nodesOf(rule) })),
    passes: results.passes.map(rule => rule.id),
  };
}

/** L'onglet visible, celui que l'auditeur regarde. */
export async function activeTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error('Aucun onglet à scanner.');
  if (!/^https?:/.test(tab.url)) {
    throw new Error('Cette page ne peut pas être scannée — ouvrez un site en http ou https.');
  }
  return tab;
}

/**
 * Scanne une page. Rien n'est agrégé ici : le verdict se rend sur l'échantillon
 * entier, une fois le panier envoyé.
 */
export async function scanTab(tab: chrome.tabs.Tab, zone?: string): Promise<BasketEntry> {
  const tabId = tab.id!;
  // Une zone est un élément du document principal : ses cadres sont sondés avec
  // elle, et les cadres du reste de la page ne la concernent pas.
  const target: chrome.scripting.InjectionTarget =
    zone === undefined ? { tabId, allFrames: true } : { tabId, frameIds: [0] };

  // axe est un fichier de l'extension, chargé dans le monde isolé de chaque
  // cadre : la CSP de la page ne s'y applique pas, et rien n'est ajouté au DOM.
  await chrome.scripting.executeScript({ target, files: ['axe.min.js'] });

  const axeResults = await chrome.scripting.executeScript({
    target,
    func: runAxe,
    args: [AXE_RULES, zone ?? null],
  });
  const probes = await chrome.scripting.executeScript({
    target,
    func: probeDocument,
    args: [
      {
        ...(zone === undefined ? {} : { root: zone }),
        naSelectors: NA_SELECTORS,
        failSelectors: FOUND_SELECTORS,
        snippetMax: SNIPPET_MAX,
        nodesPerSelector: NODES_PER_SELECTOR,
      },
    ],
  });

  // Les critères « dans chaque page web » ne regardent que le document principal.
  const [mainProbe] = await chrome.scripting.executeScript({
    target: { tabId, frameIds: [0] },
    func: probeDocument,
    args: [
      {
        ...(zone === undefined ? {} : { root: zone }),
        naSelectors: [],
        failSelectors: MAIN_FRAME_FAIL_SELECTORS,
        snippetMax: SNIPPET_MAX,
        nodesPerSelector: NODES_PER_SELECTOR,
      },
    ],
  });

  const frames: FrameScan[] = [];
  for (const entry of axeResults) {
    const axe = entry.result;
    if (!axe) continue;
    frames.push({ ...axe, present: {}, found: {} });
  }
  for (const entry of probes) {
    const probe = entry.result as ProbeResult | null;
    if (!probe) continue;
    frames.push({ violations: [], incomplete: [], passes: [], ...probe });
  }

  const version = axeResults.map(entry => entry.result?.version).find(Boolean) ?? null;
  const page = mergePageScan(tab.url!, frames, (mainProbe?.result as ProbeResult | null) ?? undefined);

  return {
    page,
    scannedAt: new Date().toISOString(),
    axeVersion: version,
    frames: probes.length,
    ...(zone === undefined ? {} : { zone }),
  };
}

/** Poste le rapport dans l'onglet Accessipote et l'amène au premier plan. */
export async function sendToApp(report: ExtensionReport): Promise<void> {
  const tabs = await chrome.tabs.query({
    url: ['http://localhost:5173/*', 'https://accessipote.fr/*'],
  });
  const target = tabs[0];
  if (!target?.id) throw new Error('Ouvrez Accessipote dans un onglet, puis réessayez.');

  await chrome.scripting.executeScript({
    target: { tabId: target.id },
    // L'app revalide ce texte comme elle validerait un fichier : le message
    // n'ouvre aucun chemin de confiance.
    func: (json: string) => window.postMessage({ source: 'accessipote-scan', report: json }, location.origin),
    args: [JSON.stringify(report)],
  });

  await chrome.tabs.update(target.id, { active: true });
  if (target.windowId !== undefined) await chrome.windows.update(target.windowId, { focused: true });
}
