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
  /**
   * Sélecteur de la zone scannée, si le scan n'a pas porté sur la page entière.
   *
   * Ce qui suit tient à ça : « aucun tableau dans cet en-tête » ne fait pas un
   * site sans tableau. L'app dégrade les non applicables d'un rapport de zone,
   * et c'est ce champ qui l'en informe.
   */
  zone?: string;
  /**
   * Page visitée par le crawl, à `load`, sans qu'aucun geste ne l'ait ouverte.
   *
   * Même conséquence qu'une zone : ce qui manque à cet état ne manque pas au
   * site.
   */
  crawled?: true;
}

/** Le rapport, tel que l'application sait le lire. */
export interface ExtensionReport {
  schema: number;
  scannedAt: string;
  urls: string[];
  zones?: string[];
  crawled?: boolean;
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
  // Une seule zone dans le lot suffit à teinter le rapport : le rapport ne dit
  // pas quel non applicable vient de quelle entrée, et prudence vaut mieux.
  const zones = basket.map(entry => entry.zone).filter((zone): zone is string => zone !== undefined);
  const crawled = basket.some(entry => entry.crawled === true);

  return {
    schema: SCHEMA,
    scannedAt: new Date().toISOString(),
    urls: basket.map(entry => entry.page.url),
    ...(zones.length > 0 ? { zones } : {}),
    ...(crawled ? { crawled } : {}),
    axeVersion: basket.map(entry => entry.axeVersion).find(Boolean) ?? null,
    // Le parcours fait partie du rapport : ici, c'est l'état où l'auditeur a
    // lui-même amené chaque page — ce qu'aucun scan automatique ne sait atteindre.
    crawl: {
      networkIdle: false,
      scrolled: false,
      frames: basket.reduce((total, entry) => total + entry.frames, 0),
    },
    criteria: zoned(
      aggregate(
        basket.map(entry => entry.page),
        RGAA_MAPPING,
      ),
      zones.length > 0 || crawled,
    ),
  };
}

/**
 * Ce qu'un échantillon partiel permet de conclure, et ce qu'il ne permet pas.
 *
 * Un contre-exemple trouvé dans un en-tête, ou sur une page visitée par le
 * crawl, reste un contre-exemple du site. L'absence d'un support, non :
 * « aucun tableau dans cet en-tête » ne fait pas un site sans tableau, et ce
 * qu'un crawl ne voit pas à `load` peut n'attendre qu'un clic.
 *
 * L'application applique la même règle à la réception — elle ne croit personne
 * sur parole — mais le décompte du popup doit dire la même chose qu'elle, sans
 * quoi il ment à l'auditeur.
 */
function zoned(
  criteria: ReturnType<typeof aggregate>,
  partial: boolean,
): ReturnType<typeof aggregate> {
  if (!partial) return criteria;

  return Object.fromEntries(
    Object.entries(criteria).map(([id, outcome]) => [
      id,
      outcome.verdict === 'na' ? { ...outcome, certainty: 'probable' as const } : outcome,
    ]),
  );
}
