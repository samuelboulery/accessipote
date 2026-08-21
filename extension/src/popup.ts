/**
 * Le popup : trois gestes, aucun jargon.
 *
 * Il n'affiche qu'un décompte par niveau de certitude — le tri fin et la
 * décision appartiennent à l'application, qui sait ce qu'est un audit.
 */
import { activeTab, scanTab, sendToApp } from './scanTab.ts';
import type { ExtensionReport } from './scanTab.ts';

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const pageLabel = byId<HTMLParagraphElement>('page');
const scanButton = byId<HTMLButtonElement>('scan');
const sendButton = byId<HTMLButtonElement>('send');
const status = byId<HTMLParagraphElement>('status');
const tally = byId<HTMLUListElement>('tally');

let report: ExtensionReport | null = null;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : 'Scan impossible sur cette page.';

void activeTab()
  .then(tab => {
    pageLabel.textContent = tab.url ?? '';
  })
  .catch(error => {
    pageLabel.textContent = messageOf(error);
    scanButton.disabled = true;
  });

function showTally(scanned: ExtensionReport): void {
  const counts = { fail: 0, na: 0, probable: 0, pass: 0, unknown: 0 };
  for (const outcome of Object.values(scanned.criteria)) {
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
  tally.hidden = false;
}

scanButton.addEventListener('click', async () => {
  scanButton.disabled = true;
  status.textContent = 'Scan en cours…';
  tally.hidden = true;

  try {
    report = await scanTab(await activeTab());
    showTally(report);
    status.textContent = 'Page scannée. Rien n’a encore été écrit dans votre audit.';
    sendButton.hidden = false;
  } catch (error) {
    report = null;
    status.textContent = messageOf(error);
  } finally {
    scanButton.disabled = false;
  }
});

sendButton.addEventListener('click', async () => {
  if (!report) return;
  sendButton.disabled = true;

  try {
    await sendToApp(report);
    status.textContent = 'Rapport envoyé — la revue s’ouvre dans Accessipote.';
  } catch (error) {
    status.textContent = messageOf(error);
  } finally {
    sendButton.disabled = false;
  }
});
