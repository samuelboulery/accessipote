/**
 * Le panier d'échantillon : ce que l'extension retient entre deux pages.
 *
 * L'enjeu du lot n'est pas le confort mais la justesse — un non applicable ne
 * vaut que si le support est absent de *toutes* les pages envoyées.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { PageScan } from '../../src/scan/types';
import {
  BASKET_KEY,
  emptyBasket,
  putInBasket,
  readBasket,
  removeFromBasket,
  reportOf,
} from './basket';

/** `chrome.storage.local` réduit à ce que le panier en attend. */
function fakeStorage(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: data[key] }),
        set: async (patch: Record<string, unknown>) => Object.assign(data, patch),
        remove: async (key: string) => {
          delete data[key];
        },
      },
    },
  };
  return data;
}

function pageScan(url: string, overrides: Partial<PageScan> = {}): PageScan {
  return {
    url,
    violations: [],
    incomplete: [],
    passes: [],
    present: {},
    found: {},
    ...overrides,
  };
}

const entry = (url: string, overrides: Partial<PageScan> = {}) => ({
  page: pageScan(url, overrides),
  scannedAt: '2026-08-21T10:00:00.000Z',
  axeVersion: '4.10.0',
  frames: 1,
});

describe('panier d’échantillon', () => {
  beforeEach(() => {
    fakeStorage();
  });

  it('part vide', async () => {
    expect(await readBasket()).toEqual([]);
  });

  it('garde les pages ajoutées, dans l’ordre de la navigation', async () => {
    await putInBasket(entry('https://exemple.fr/a'));
    await putInBasket(entry('https://exemple.fr/b'));

    expect((await readBasket()).map(item => item.page.url)).toEqual([
      'https://exemple.fr/a',
      'https://exemple.fr/b',
    ]);
  });

  it('remplace la page rescannée au lieu de la doubler', async () => {
    await putInBasket(entry('https://exemple.fr/a'));
    await putInBasket({ ...entry('https://exemple.fr/a'), scannedAt: '2026-08-21T11:00:00.000Z' });

    const basket = await readBasket();
    expect(basket).toHaveLength(1);
    expect(basket[0].scannedAt).toBe('2026-08-21T11:00:00.000Z');
  });

  it('retire une page et vide le panier', async () => {
    await putInBasket(entry('https://exemple.fr/a'));
    await putInBasket(entry('https://exemple.fr/b'));

    expect(await removeFromBasket('https://exemple.fr/a')).toHaveLength(1);
    await emptyBasket();
    expect(await readBasket()).toEqual([]);
  });

  it('survit à un contenu illisible en mémoire', async () => {
    const data = fakeStorage();
    data[BASKET_KEY] = 'pas un panier';

    expect(await readBasket()).toEqual([]);
  });
});

describe('rapport du panier', () => {
  it('porte toutes les adresses et la somme des cadres', () => {
    const report = reportOf([entry('https://exemple.fr/a'), { ...entry('https://exemple.fr/b'), frames: 3 }]);

    expect(report.schema).toBe(3);
    expect(report.urls).toEqual(['https://exemple.fr/a', 'https://exemple.fr/b']);
    expect(report.crawl.frames).toBe(4);
    expect(report.axeVersion).toBe('4.10.0');
  });

  it('porte les zones scannées, et rien si le lot ne contient que des pages', () => {
    expect(reportOf([entry('https://exemple.fr/a')]).zones).toBeUndefined();

    const report = reportOf([
      entry('https://exemple.fr/a'),
      { ...entry('https://exemple.fr/b'), zone: '#header' },
    ]);

    // Une seule zone dans le lot suffit : l'app dégradera tous les non
    // applicables, faute de savoir lequel vient d'où.
    expect(report.zones).toEqual(['#header']);
  });

  it('dégrade le non applicable dès qu’une zone est dans le lot', () => {
    // Le décompte du popup dit alors la même chose que l'écran de revue :
    // l'absence d'un support dans une zone ne prouve rien pour le site.
    const report = reportOf([{ ...entry('https://exemple.fr/a'), zone: '#header' }]);

    expect(report.criteria['5.7'].verdict).toBe('na');
    expect(report.criteria['5.7'].certainty).toBe('probable');
  });

  it('ne conclut au non applicable que si le support manque à toutes les pages', () => {
    const sansTable = reportOf([entry('https://exemple.fr/a'), entry('https://exemple.fr/b')]);
    expect(sansTable.criteria['5.7'].verdict).toBe('na');

    const avecTable = reportOf([
      entry('https://exemple.fr/a'),
      { ...entry('https://exemple.fr/b'), page: pageScan('https://exemple.fr/b', { present: { table: 2 } }) },
    ]);
    expect(avecTable.criteria['5.7'].verdict).not.toBe('na');
  });
});
