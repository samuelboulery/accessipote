/**
 * Le panier d'échantillon : ce que l'extension retient entre deux pages.
 *
 * Une page seule ne prouve aucun non applicable — le support peut vivre sur la
 * page suivante. L'auditeur navigue, ajoute ce qui compose son échantillon,
 * puis envoie le lot ; c'est aussi le seul chemin vers ce qui est derrière une
 * connexion, qu'aucun crawl n'atteindra.
 *
 * Le panier vit dans `chrome.storage.local` : il survit à la fermeture du
 * popup, et rien ne sort du poste.
 */
import { aggregate } from '../../src/scan/aggregate.ts';
import { RGAA_MAPPING } from '../../src/scan/rgaaMapping.ts';
import type { PageScan } from '../../src/scan/types.ts';

export const BASKET_KEY = 'sample-basket';
const SCHEMA = 3;

/** Une page du panier, telle que le scan l'a récoltée. */
export interface BasketEntry {
  page: PageScan;
  scannedAt: string;
  axeVersion: string | null;
  /** Cadres visités sur cette page — le rapport en porte la somme. */
  frames: number;
}

/** Le rapport, tel que l'application sait le lire. */
export interface ExtensionReport {
  schema: number;
  scannedAt: string;
  urls: string[];
  axeVersion: string | null;
  crawl: { networkIdle: boolean; scrolled: boolean; frames: number };
  criteria: ReturnType<typeof aggregate>;
}

export async function readBasket(): Promise<BasketEntry[]> {
  const stored = await chrome.storage.local.get(BASKET_KEY);
  const basket = stored[BASKET_KEY];
  // Un stockage illisible n'est pas une erreur à remonter : on repart d'un
  // panier vide plutôt que de bloquer le popup.
  return Array.isArray(basket) ? (basket as BasketEntry[]) : [];
}

async function write(basket: BasketEntry[]): Promise<BasketEntry[]> {
  await chrome.storage.local.set({ [BASKET_KEY]: basket });
  return basket;
}

/** Ajoute la page, ou remplace celle qui portait déjà cette adresse. */
export async function putInBasket(entry: BasketEntry): Promise<BasketEntry[]> {
  const kept = (await readBasket()).filter(item => item.page.url !== entry.page.url);
  return write([...kept, entry]);
}

export async function removeFromBasket(url: string): Promise<BasketEntry[]> {
  return write((await readBasket()).filter(item => item.page.url !== url));
}

export async function emptyBasket(): Promise<void> {
  await chrome.storage.local.remove(BASKET_KEY);
}

/**
 * Le rapport du lot entier.
 *
 * L'agrégation porte sur toutes les pages d'un coup : c'est là que se joue la
 * règle du non applicable, qui exige l'absence du support partout.
 */
export function reportOf(basket: BasketEntry[]): ExtensionReport {
  return {
    schema: SCHEMA,
    scannedAt: new Date().toISOString(),
    urls: basket.map(entry => entry.page.url),
    axeVersion: basket.map(entry => entry.axeVersion).find(Boolean) ?? null,
    // Le parcours fait partie du rapport : ici, c'est l'état où l'auditeur a
    // lui-même amené chaque page — ce qu'aucun scan automatique ne sait atteindre.
    crawl: {
      networkIdle: false,
      scrolled: false,
      frames: basket.reduce((total, entry) => total + entry.frames, 0),
    },
    criteria: aggregate(
      basket.map(entry => entry.page),
      RGAA_MAPPING,
    ),
  };
}
