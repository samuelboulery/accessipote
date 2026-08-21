/**
 * Le crawl, sans navigateur : Chrome est remplacé par un double qui répond
 * comme lui, ce qui rend jouable ce qui, dans la vraie vie, dépend d'un site
 * distant, d'un onglet et d'une latence.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { collectLinks } from '../../src/scan/collect';
import { crawl, readCrawlState, stopCrawl } from './crawl';
import { readBasket } from './basket';

const ORIGIN = 'https://exemple.fr';

/** Le plan du faux site : ce que chaque page porte comme liens. */
const SITE: Record<string, string[]> = {
  [`${ORIGIN}/`]: [`${ORIGIN}/a`, `${ORIGIN}/prive`, 'https://ailleurs.example/x'],
  [`${ORIGIN}/a`]: [`${ORIGIN}/b`, `${ORIGIN}/casse`],
  [`${ORIGIN}/b`]: [],
  [`${ORIGIN}/prive`]: [],
};

const ROBOTS = 'User-agent: *\nDisallow: /prive\n';

function fakeChrome(): void {
  const data: Record<string, unknown> = {};
  const listeners = new Set<(id: number, info: { status?: string }) => void>();
  let current = 'about:blank';

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
    tabs: {
      create: async () => ({ id: 1, url: 'about:blank' }),
      get: async () => ({ id: 1, url: current }),
      remove: async () => {},
      update: async (_id: number, { url }: { url: string }) => {
        // Chrome refuse certaines adresses : le crawl doit compter l'échec.
        if (url.endsWith('/casse')) throw new Error('Adresse refusée');
        current = url;
        queueMicrotask(() => {
          for (const listener of listeners) listener(1, { status: 'complete' });
        });
      },
      onUpdated: {
        addListener: (listener: (id: number, info: { status?: string }) => void) =>
          listeners.add(listener),
        removeListener: (listener: (id: number, info: { status?: string }) => void) =>
          listeners.delete(listener),
      },
    },
    scripting: {
      executeScript: async ({ func }: { func?: unknown }) =>
        func === collectLinks ? [{ result: SITE[current] ?? [] }] : [{ result: null }],
    },
  };

  (globalThis as unknown as { fetch: unknown }).fetch = async () => ({
    ok: true,
    text: async () => ROBOTS,
  });
}

const visited = async (): Promise<string[]> => (await readBasket()).map(entry => entry.page.url);

describe('crawl', () => {
  beforeEach(() => {
    fakeChrome();
  });

  it('constitue un échantillon depuis une seule adresse', async () => {
    await crawl({ start: `${ORIGIN}/`, maxPages: 10, maxDepth: 2 });

    expect(await visited()).toEqual([`${ORIGIN}/`, `${ORIGIN}/a`, `${ORIGIN}/b`]);
  });

  it('marque chaque page comme venue du crawl', async () => {
    await crawl({ start: `${ORIGIN}/`, maxPages: 1, maxDepth: 0 });

    expect((await readBasket()).every(entry => entry.crawled === true)).toBe(true);
  });

  it('respecte robots.txt', async () => {
    await crawl({ start: `${ORIGIN}/`, maxPages: 10, maxDepth: 2 });

    expect(await visited()).not.toContain(`${ORIGIN}/prive`);
  });

  it('ne sort pas de l’origine de départ', async () => {
    await crawl({ start: `${ORIGIN}/`, maxPages: 10, maxDepth: 2 });

    expect((await visited()).every(url => url.startsWith(ORIGIN))).toBe(true);
  });

  it('s’arrête au nombre de pages demandé', async () => {
    await crawl({ start: `${ORIGIN}/`, maxPages: 2, maxDepth: 3 });

    expect(await visited()).toHaveLength(2);
  });

  it('ne descend pas plus bas que la profondeur demandée', async () => {
    await crawl({ start: `${ORIGIN}/`, maxPages: 10, maxDepth: 1 });

    expect(await visited()).toEqual([`${ORIGIN}/`, `${ORIGIN}/a`]);
  });

  it('compte les pages en échec, et l’échantillon ne se dit pas complet', async () => {
    await crawl({ start: `${ORIGIN}/`, maxPages: 10, maxDepth: 2 });

    const state = await readCrawlState();
    expect(state?.failed).toEqual([`${ORIGIN}/casse`]);
    expect(state?.running).toBe(false);
  });

  it('s’interrompt sur demande', async () => {
    const running = crawl({ start: `${ORIGIN}/`, maxPages: 10, maxDepth: 2 });
    stopCrawl();
    await running;

    const state = await readCrawlState();
    expect(state?.stopped).toBe(true);
    expect(state?.scanned).toBeLessThan(3);
  });
});
