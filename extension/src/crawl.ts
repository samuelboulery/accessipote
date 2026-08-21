/**
 * Le crawl : constituer un échantillon sans autre geste qu'une adresse.
 *
 * C'est le morceau le plus fragile de l'extension, et il se tient à trois
 * règles : même origine, `robots.txt` respecté, limites explicites. Un robot
 * qui parcourt le site d'autrui se conduit.
 *
 * Ce qu'il rapporte vaut moins qu'une page ouverte à la main : il scanne à
 * `load`, sans qu'aucun clic n'ait déplié quoi que ce soit. Chaque page en
 * porte la mention (`crawled`), et l'échantillon n'écrit donc aucun non
 * applicable.
 */
import { isAllowed, parseRobots } from '../../src/scan/robots.ts';
import type { RobotsRules } from '../../src/scan/robots.ts';
import { collectLinks } from '../../src/scan/collect.ts';
import { putInBasket } from './basket.ts';
import { scanTab } from './scanTab.ts';

export const CRAWL_KEY = 'crawl-state';

/** Délai au-delà duquel une page est comptée en échec plutôt qu'attendue. */
const PAGE_TIMEOUT = 20_000;

export interface CrawlLimits {
  start: string;
  maxPages: number;
  maxDepth: number;
}

/** Ce que le popup affiche pendant que le crawl tourne — et après. */
export interface CrawlState {
  running: boolean;
  current: string | null;
  scanned: number;
  /** Adresses que le crawl n'a pas su scanner : l'échantillon n'est pas complet. */
  failed: string[];
  maxPages: number;
  /** Le crawl s'est arrêté sur demande, avant d'avoir fini. */
  stopped: boolean;
}

// ponytail : un drapeau en mémoire suffit tant qu'un seul crawl tourne à la
// fois. Deux crawls concurrents demanderaient une identité par crawl.
let abort = false;

export function stopCrawl(): void {
  abort = true;
}

export async function readCrawlState(): Promise<CrawlState | null> {
  const stored = await chrome.storage.local.get(CRAWL_KEY);
  return (stored[CRAWL_KEY] as CrawlState | undefined) ?? null;
}

async function save(state: CrawlState): Promise<void> {
  await chrome.storage.local.set({ [CRAWL_KEY]: state });
}

/** Les règles du site, ou rien du tout si le fichier est absent ou illisible. */
async function fetchRobots(origin: string): Promise<RobotsRules> {
  try {
    const response = await fetch(`${origin}/robots.txt`);
    if (!response.ok) return { allow: [], disallow: [] };
    return parseRobots(await response.text());
  } catch {
    return { allow: [], disallow: [] };
  }
}

/** Navigue, et rend la main quand la page a fini de charger — ou renonce. */
function navigate(tabId: number, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
    };
    const listener = (id: number, info: chrome.tabs.OnUpdatedInfo) => {
      if (id !== tabId || info.status !== 'complete') return;
      done();
      resolve();
    };
    const timer = setTimeout(() => {
      done();
      reject(new Error(`Page trop lente : ${url}`));
    }, PAGE_TIMEOUT);

    chrome.tabs.onUpdated.addListener(listener);
    // Une adresse que Chrome refuse doit compter en échec tout de suite, pas au
    // bout du délai d'attente.
    chrome.tabs.update(tabId, { url }).catch((error: unknown) => {
      done();
      reject(error instanceof Error ? error : new Error(`Adresse refusée : ${url}`));
    });
  });
}

async function linksOf(tabId: number): Promise<string[]> {
  const [found] = await chrome.scripting.executeScript({
    target: { tabId, frameIds: [0] },
    func: collectLinks,
  });
  return (found?.result as string[] | undefined) ?? [];
}

/**
 * Parcourt le site en largeur, à partir de l'adresse donnée.
 *
 * L'onglet est unique et réutilisé : ouvrir vingt onglets mettrait la machine à
 * genoux pour rien. Il est ouvert en arrière-plan, et refermé quoi qu'il arrive.
 */
export async function crawl(limits: CrawlLimits): Promise<void> {
  abort = false;
  const origin = new URL(limits.start).origin;
  const rules = await fetchRobots(origin);

  const queue: Array<{ url: string; depth: number }> = [{ url: limits.start, depth: 0 }];
  const seen = new Set([limits.start]);
  const failed: string[] = [];
  let scanned = 0;

  const state = (): CrawlState => ({
    running: true,
    current: null,
    scanned,
    failed,
    maxPages: limits.maxPages,
    stopped: false,
  });

  const tab = await chrome.tabs.create({ url: 'about:blank', active: false });
  const tabId = tab.id!;

  try {
    while (queue.length > 0 && scanned < limits.maxPages && !abort) {
      const { url, depth } = queue.shift()!;
      await save({ ...state(), current: url });

      try {
        await navigate(tabId, url);
        const visited = await chrome.tabs.get(tabId);
        await putInBasket({ ...(await scanTab(visited)), crawled: true });
        scanned += 1;

        if (depth >= limits.maxDepth) continue;
        for (const link of await linksOf(tabId)) {
          if (seen.has(link)) continue;
          const target = new URL(link);
          if (target.origin !== origin || !isAllowed(rules, target.pathname)) continue;
          seen.add(link);
          queue.push({ url: link, depth: depth + 1 });
        }
      } catch {
        // Une page en échec ne fait pas passer l'échantillon pour complet : elle
        // est comptée, nommée, et le crawl continue.
        failed.push(url);
      }
    }
  } finally {
    await chrome.tabs.remove(tabId);
    await save({ ...state(), running: false, stopped: abort });
  }
}
