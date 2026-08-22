/**
 * Scan automatique d'un échantillon de pages, pour pré-remplir un audit RGAA.
 *
 *   node src/scripts/scan.ts https://exemple.fr https://exemple.fr/contact
 *   node src/scripts/scan.ts -o rapport.json https://exemple.fr
 *
 * Ce script ne contient que du pilotage : réduire des pages en `PageScan`, puis
 * appeler le moteur. Toute la décision vit dans `src/scan/aggregate.ts`, qui est
 * pur et testé.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import type { Browser, Frame, Page } from 'playwright';
import type { AxeResults } from 'axe-core';
import { aggregate } from '../scan/aggregate.ts';
import { probeDocument } from '../scan/collect.ts';
import { mergePageScan } from '../scan/mergeFrames.ts';
import {
  AXE_RULES,
  FOUND_SELECTORS,
  MAIN_FRAME_FAIL_SELECTORS,
  NA_SELECTORS,
  RGAA_MAPPING,
} from '../scan/rgaaMapping.ts';
import type { Certainty, FrameScan, PageScan, ProbeResult, TestVerdict } from '../scan/types.ts';

const SCHEMA = 3;
const SNIPPET_MAX = 200;
const NODES_PER_SELECTOR = 5;
const PAGE_TIMEOUT_MS = 30_000;
const NETWORK_IDLE_MS = 20_000;
const AXE_TIMEOUT_MS = 60_000;
const SCROLL_STEP_MS = 250;
const SETTLE_MS = 2_000;

interface Options {
  urls: string[];
  out: string | null;
}

function parseArgs(argv: string[]): Options {
  const urls: string[] = [];
  let out: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '-o' || argv[i] === '--out') {
      const value = argv[i + 1];
      // Sans cette vérification, `scan -o` scanne tout puis n'écrit nulle part.
      if (value === undefined) throw new Error('Option -o : un chemin de fichier est attendu.');
      out = value;
      i += 1;
    } else {
      urls.push(argv[i]);
    }
  }

  return { urls, out };
}

/** Le code source d'axe-core, à injecter dans chaque page. */
function readAxeSource(): string {
  const require = createRequire(import.meta.url);
  return readFileSync(require.resolve('axe-core'), 'utf8');
}

/**
 * Injecte la sonde dans un document et rapporte ce qu'elle y trouve.
 *
 * `evaluate` sérialise `probeDocument` par `toString()` : la fonction doit se
 * suffire à elle-même, et c'est un invariant tenu par ses tests. Un cadre
 * détaché ou inaccessible rend `null` — pas un résultat vide, qui ferait croire
 * à une page vérifiée.
 */
async function collect(
  frame: Frame,
  naSelectors: string[],
  failSelectors: string[],
): Promise<ProbeResult | null> {
  return frame
    .evaluate(probeDocument, {
      naSelectors,
      failSelectors,
      snippetMax: SNIPPET_MAX,
      nodesPerSelector: NODES_PER_SELECTOR,
    })
    .catch(() => null);
}

/**
 * Amène la page à un état où l'absence constatée veut dire quelque chose.
 *
 * Mesuré pendant le pic (T-0057) : sur arte.tv, un site de vidéo, le document
 * ne contient aucune balise `<video>` à l'événement `load` — elle apparaît cinq
 * secondes plus tard. Sonder à `load` aurait déclaré les treize critères du
 * thème Multimédia non applicables, et le scan les écrit sans validation.
 *
 * Attendre le réseau au repos puis dérouler la page fait passer arte.tv de zéro
 * à deux médias trouvés. Ce parcours élargit ce qu'on atteint ; il ne prouve pas
 * l'exhaustivité — un contenu derrière un onglet ou une modale reste invisible.
 */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {
    // Un site qui sonde en permanence n'atteint jamais le repos. Le défilement
    // qui suit reste utile.
  });

  await page.evaluate(async (step) => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, step));
    }
    window.scrollTo(0, 0);
  }, SCROLL_STEP_MS);

  await page.waitForTimeout(SETTLE_MS);
}

/**
 * Réduit une page, et les cadres qu'elle contient, à ce dont le moteur a besoin.
 *
 * Le navigateur est celui de la campagne : le relancer par page coûterait une
 * seconde chaque fois, pour rien. Chaque page a en revanche son onglet, fermé
 * ensuite — un état laissé derrière fausserait la suivante.
 */
async function scanPage(
  browser: Browser,
  url: string,
  axeSource: string,
): Promise<{ page: PageScan; axeVersion: string; frames: number }> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
    await settle(page);

    // `addScriptTag` insère une balise dans le DOM, et se fait donc refuser par
    // toute CSP sans `unsafe-inline` — Accessipote elle-même en est un cas.
    // `evaluate` passe par le protocole de débogage, hors de portée de la CSP :
    // la page est scannée exactement telle qu'elle est servie, sans qu'on ait
    // eu à désactiver quoi que ce soit.
    //
    // L'injection vise tous les cadres : c'est ce qui permet à axe de les
    // traverser, et aux sélecteurs d'y compter ce qu'ils contiennent.
    const frames = page.frames();
    for (const frame of frames) {
      await frame.evaluate(axeSource).catch(() => {
        // Cadre détaché ou inaccessible : il ne sera pas compté.
      });
    }

    const axe = await page.evaluate(
      async ({ rules, timeout }) => {
        const run = (window as unknown as { axe: { run: (options: unknown) => Promise<AxeResults> } }).axe.run({
          runOnly: { type: 'rule', values: rules },
        });
        const results = await Promise.race([
          run,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('axe : délai dépassé')), timeout)),
        ]);
        return {
          version: results.testEngine.version,
          violations: results.violations.map((violation) => ({
            id: violation.id,
            nodes: violation.nodes.map((node) => ({
              selector: node.target.join(' '),
              snippet: node.html.slice(0, 200),
            })),
          })),
          // Les nœuds d'un `incomplete` sont ce que l'auditeur ira regarder :
          // sans eux, « quelque part sur la page » n'est pas instruisible.
          incomplete: results.incomplete.map((rule) => ({
            id: rule.id,
            nodes: rule.nodes.map((node) => ({
              selector: node.target.join(' '),
              snippet: node.html.slice(0, 200),
            })),
          })),
          passes: results.passes.map((rule) => rule.id),
        };
      },
      { rules: AXE_RULES, timeout: AXE_TIMEOUT_MS },
    );

    // axe traverse déjà les cadres par le protocole de débogage : ses résultats
    // valent pour la page entière et n'arrivent donc qu'une fois, sur le
    // premier cadre. La sonde, elle, s'exécute cadre par cadre.
    const collected: FrameScan[] = [
      { violations: axe.violations, incomplete: axe.incomplete, passes: axe.passes, present: {}, found: {} },
    ];

    for (const frame of frames) {
      const counted = await collect(frame, NA_SELECTORS, FOUND_SELECTORS);
      if (counted === null) continue;
      collected.push({ violations: [], incomplete: [], passes: [], ...counted });
    }

    const mainFrame = await collect(page.mainFrame(), [], MAIN_FRAME_FAIL_SELECTORS);

    return {
      page: mergePageScan(url, collected, mainFrame ?? undefined),
      axeVersion: axe.version,
      frames: frames.length,
    };
  } finally {
    await context.close();
  }
}

const LABELS: Record<TestVerdict, string> = {
  fail: 'non conforme',
  na: 'non applicable',
  pass: 'conforme (à confirmer)',
  unknown: 'à évaluer',
};

/** Ce que la certitude change au libellé : un probable attend l'auditeur. */
function label(outcome: { verdict: TestVerdict; certainty: Certainty }): string {
  const base = LABELS[outcome.verdict];
  return outcome.certainty === 'probable' ? `${base} ? (à vérifier)` : base;
}

async function main(): Promise<void> {
  const { urls, out } = parseArgs(process.argv.slice(2));

  if (urls.length === 0) {
    console.error('Usage : node src/scripts/scan.ts [-o rapport.json] <url> [url...]');
    process.exit(1);
  }

  const axeSource = readAxeSource();
  const pages: PageScan[] = [];
  let axeVersion: string | null = null;
  let frames = 0;

  const browser = await chromium.launch();
  try {
    for (const url of urls) {
      console.log(`→ ${url}`);
      try {
        const scanned = await scanPage(browser, url, axeSource);
        pages.push(scanned.page);
        axeVersion = scanned.axeVersion;
        frames += scanned.frames;
      } catch (error) {
        // Une page manquante rend tout « non applicable » indéfendable : l'absence
        // constatée ne porterait plus sur l'échantillon entier. On s'arrête.
        console.error(`\nÉchec sur ${url} : ${error instanceof Error ? error.message : error}`);
        console.error("Scan interrompu — un échantillon incomplet ne prouve aucun non applicable.");
        process.exit(1);
      }
    }
  } finally {
    await browser.close();
  }

  const criteria = aggregate(pages, RGAA_MAPPING);

  const report = {
    schema: SCHEMA,
    scannedAt: new Date().toISOString(),
    urls,
    axeVersion,
    // Le parcours effectué fait partie du rapport : le non applicable ne vaut
    // que relativement à ce qui a été atteint.
    crawl: { networkIdle: true, scrolled: true, frames },
    criteria,
  };

  const counts: Record<TestVerdict, number> = { fail: 0, na: 0, pass: 0, unknown: 0 };
  let probable = 0;
  console.log(`\n${urls.length} page(s), ${Object.keys(criteria).length} critère(s) regardé(s)\n`);
  for (const [id, outcome] of Object.entries(criteria)) {
    if (outcome.certainty === 'probable' && outcome.verdict !== 'pass') probable += 1;
    else counts[outcome.verdict] += 1;
    console.log(`  ${id.padEnd(5)} ${label(outcome)}`);
  }

  const preRemplis = counts.fail + counts.na;
  console.log(`\n  ${counts.fail} non conforme(s), ${counts.na} non applicable(s) — écrits directement`);
  console.log(`  ${probable} probable(s) — à vérifier par l'auditeur`);
  console.log(`  ${counts.pass} conforme(s) proposé(s) — à confirmer par l'auditeur`);
  console.log(`  ${counts.unknown} laissé(s) à évaluer`);
  console.log(`\n  Pré-remplissage sans intervention : ${preRemplis} critère(s).`);

  if (out) {
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`\nRapport écrit dans ${out}`);
  }
}

// Une erreur de pilotage se dit en une ligne : une trace d'appels n'apprend rien
// à qui lance un scan.
await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
