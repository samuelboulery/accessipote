/**
 * Le popup : naviguer, ajouter au panier, envoyer le lot.
 *
 * Il n'affiche qu'un décompte par niveau de certitude — le tri fin et la
 * décision appartiennent à l'application, qui sait ce qu'est un audit. Le
 * décompte porte sur le panier entier, parce que c'est sur l'échantillon
 * complet que se rend un verdict.
 */
import {
  emptyBasket,
  putInBasket,
  readBasket,
  removeFromBasket,
  reportOf,
} from './basket.ts';
import type { BasketEntry } from './basket.ts';
import { activeTab, scanTab, sendToApp } from './scanTab.ts';

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const pageLabel = byId<HTMLParagraphElement>('page');
const scanButton = byId<HTMLButtonElement>('scan');
const zoneButton = byId<HTMLButtonElement>('zone');
const sendButton = byId<HTMLButtonElement>('send');
const emptyButton = byId<HTMLButtonElement>('empty');
const status = byId<HTMLParagraphElement>('status');
const tally = byId<HTMLUListElement>('tally');
const basketList = byId<HTMLUListElement>('basket');

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : 'Scan impossible sur cette page.';

const pageCount = (count: number) => `${count} page${count > 1 ? 's' : ''}`;

void activeTab()
  .then(tab => {
    pageLabel.textContent = tab.url ?? '';
  })
  .catch(error => {
    pageLabel.textContent = messageOf(error);
    scanButton.disabled = true;
  });

/** Le panier vu par l'auditeur : ses pages, et ce que le lot vaut aujourd'hui. */
function render(basket: BasketEntry[]): void {
  basketList.replaceChildren(
    ...basket.map(entry => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = entry.zone ? `${entry.page.url} — zone ${entry.zone}` : entry.page.url;
      label.className = 'url';

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = 'Retirer';
      remove.setAttribute('aria-label', `Retirer ${entry.page.url} du panier`);
      remove.addEventListener('click', async () => {
        render(await removeFromBasket(entry.page.url));
      });

      item.append(label, remove);
      return item;
    }),
  );

  const filled = basket.length > 0;
  basketList.hidden = !filled;
  emptyButton.hidden = !filled;
  sendButton.hidden = !filled;
  tally.hidden = !filled;
  if (!filled) return;

  sendButton.textContent = `Envoyer ${pageCount(basket.length)} vers Accessipote`;

  const counts = { fail: 0, na: 0, probable: 0, pass: 0, unknown: 0 };
  for (const outcome of Object.values(reportOf(basket).criteria)) {
    if (outcome.certainty === 'probable' && outcome.verdict !== 'pass') counts.probable += 1;
    else counts[outcome.verdict] += 1;
  }

  const lines: Array<[number, string]> = [
    [counts.fail, 'non conforme(s) — prouvé(s)'],
    [counts.na, 'non applicable(s) — prouvé(s)'],
    [counts.probable, 'à vérifier — probable(s)'],
    [counts.pass, 'conforme(s) proposé(s)'],
  ];

  tally.replaceChildren(
    ...lines.map(([count, label]) => {
      const item = document.createElement('li');
      item.textContent = `${count} ${label}`;
      return item;
    }),
  );
}

void readBasket().then(render);
// Le badge disait le panier tant qu'aucune fenêtre ne le montrait ; elle est là.
void chrome.action.setBadgeText({ text: '' });

/**
 * Choisir une zone ferme ce popup : le clic part dans la page.
 *
 * Le service worker prend donc la suite — surbrillance, clic, scan, panier — et
 * le badge de l'icône rend compte du reste.
 */
zoneButton.addEventListener('click', async () => {
  const tab = await activeTab();
  await chrome.runtime.sendMessage({ type: 'pick-zone', tabId: tab.id });
  window.close();
});

scanButton.addEventListener('click', async () => {
  scanButton.disabled = true;
  status.textContent = 'Scan en cours…';

  try {
    render(await putInBasket(await scanTab(await activeTab())));
    status.textContent = 'Page ajoutée au panier. Rien n’a encore été écrit dans votre audit.';
  } catch (error) {
    status.textContent = messageOf(error);
  } finally {
    scanButton.disabled = false;
  }
});

emptyButton.addEventListener('click', async () => {
  await emptyBasket();
  render([]);
  status.textContent = 'Panier vidé.';
});

sendButton.addEventListener('click', async () => {
  sendButton.disabled = true;

  try {
    const basket = await readBasket();
    if (basket.length === 0) return;
    await sendToApp(reportOf(basket));
    status.textContent = 'Panier envoyé — la revue s’ouvre dans Accessipote.';
  } catch (error) {
    status.textContent = messageOf(error);
  } finally {
    sendButton.disabled = false;
  }
});
