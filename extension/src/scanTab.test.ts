/**
 * Le scan d'un onglet, Chrome remplacé par un double.
 *
 * Ce qui compte ici n'est pas ce qu'axe trouve — c'est déjà éprouvé dans
 * `src/scan/` — mais ce que l'extension demande à Chrome : quels cadres, quelle
 * zone, et ce qu'elle rend au panier.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { activeTab, scanTab } from './scanTab';

interface Injection {
  target: { tabId: number; allFrames?: boolean; frameIds?: number[] };
  files?: string[];
  args?: unknown[];
}

let injections: Injection[] = [];

function fakeChrome(tab: { id?: number; url?: string }): void {
  injections = [];
  (globalThis as unknown as { chrome: unknown }).chrome = {
    tabs: { query: async () => [tab] },
    scripting: {
      executeScript: async (injection: Injection) => {
        injections.push(injection);
        return [{ result: null }];
      },
    },
  };
}

const PAGE = { id: 7, url: 'https://exemple.fr/a' };

describe('activeTab', () => {
  it('refuse une page qui n’est pas du web', async () => {
    fakeChrome({ id: 7, url: 'chrome://extensions' });
    await expect(activeTab()).rejects.toThrow(/http/);
  });

  it('refuse un onglet sans adresse', async () => {
    fakeChrome({ id: 7 });
    await expect(activeTab()).rejects.toThrow(/onglet/i);
  });

  it('rend l’onglet visible', async () => {
    fakeChrome(PAGE);
    expect((await activeTab()).url).toBe(PAGE.url);
  });
});

describe('scanTab', () => {
  beforeEach(() => {
    fakeChrome(PAGE);
  });

  it('scanne tous les cadres de la page, axe chargé depuis l’extension', async () => {
    const entry = await scanTab(PAGE);

    expect(injections[0].files).toEqual(['axe.min.js']);
    expect(injections[0].target.allFrames).toBe(true);
    expect(entry.page.url).toBe(PAGE.url);
    expect(entry.zone).toBeUndefined();
  });

  it('restreint le scan de zone au document principal, sonde comprise', async () => {
    const entry = await scanTab(PAGE, '#header');

    expect(injections.every(injection => injection.target.allFrames !== true)).toBe(true);
    expect(injections[1].args).toEqual([expect.anything(), '#header']);
    expect((injections[2].args?.[0] as { root?: string }).root).toBe('#header');
    expect(entry.zone).toBe('#header');
  });
});
