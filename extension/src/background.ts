/**
 * Le service worker : ce qui doit survivre à la fermeture du popup.
 *
 * Choisir une zone se fait en cliquant dans la page — geste qui ferme le popup
 * de Chrome. Le scan de zone se pilote donc d'ici, et le résultat rejoint le
 * panier ; le badge de l'icône dit où en est le panier, puisque plus aucune
 * fenêtre n'est là pour le dire.
 */
import { putInBasket, readBasket } from './basket.ts';
import { crawl, stopCrawl } from './crawl.ts';
import type { CrawlLimits } from './crawl.ts';
import { pickZone } from './pickZone.ts';
import { scanTab } from './scanTab.ts';

async function showCount(): Promise<void> {
  const basket = await readBasket();
  await chrome.action.setBadgeText({ text: basket.length > 0 ? String(basket.length) : '' });
}

async function scanZone(tabId: number): Promise<void> {
  await chrome.action.setBadgeText({ text: '…' });
  const zone = await pickZone(tabId);
  if (!zone) {
    await showCount();
    return;
  }

  const tab = await chrome.tabs.get(tabId);
  await putInBasket(await scanTab(tab, zone));
  await showCount();
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const request = message as { type?: string; tabId?: number; limits?: CrawlLimits };

  if (request.type === 'pick-zone' && typeof request.tabId === 'number') {
    // Un échec ne doit pas rester muet : le badge le dit, le popup rouvert aussi.
    void scanZone(request.tabId)
      .catch(() => chrome.action.setBadgeText({ text: '!' }))
      .finally(() => sendResponse({ ok: true }));
    return true;
  }

  if (request.type === 'start-crawl' && request.limits) {
    // Le crawl dure plus longtemps que le popup : il rend la main tout de suite,
    // et rend compte par `chrome.storage`, que le popup rouvert relit.
    void crawl(request.limits)
      .catch(() => chrome.action.setBadgeText({ text: '!' }))
      .finally(showCount);
    sendResponse({ ok: true });
    return false;
  }

  if (request.type === 'stop-crawl') {
    stopCrawl();
    sendResponse({ ok: true });
    return false;
  }

  return false;
});
