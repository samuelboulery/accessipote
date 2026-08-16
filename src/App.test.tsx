import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AUDITS_STORAGE_KEY } from './constants';
import type { AuditStore } from './types';

/**
 * Test d'intégration du chemin réel : le clic jusqu'au localStorage. Les tests
 * de `AuditScreen` espionnent `onStatusChange` avec un mock ; ils passaient
 * pendant que les actions groupées ne marquaient qu'un critère sur N, parce que
 * la faute était en aval du composant, dans les closures de rendu de `App` et
 * de `useLocalStorage`.
 */
const AUDIT_ID = 'audit-de-test';

function seedAudit() {
  const store: AuditStore = {
    version: 2,
    audits: [
      {
        id: AUDIT_ID,
        name: 'Audit de test',
        mode: 'classic',
        themes: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        progress: {},
        notes: {},
        pages: {},
        checkedTests: {},
      },
    ],
    activeAuditId: AUDIT_ID,
  };
  localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(store));
}

function storedProgress(): Record<string, { status: string }> {
  const raw = localStorage.getItem(AUDITS_STORAGE_KEY);
  const store = JSON.parse(raw ?? '{}') as AuditStore;
  return (store.audits.find(audit => audit.id === AUDIT_ID)?.progress ??
    {}) as Record<string, { status: string }>;
}

async function openAudit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Audit' }));
}

/** Les trois premiers critères affichés, dans l'ordre de la liste. */
function firstThreeCheckboxes(): HTMLInputElement[] {
  return screen
    .getAllByRole('checkbox')
    .filter(box => box.getAttribute('aria-label')?.startsWith('Sélectionner le critère '))
    .slice(0, 3) as HTMLInputElement[];
}

function idsOf(boxes: HTMLInputElement[]): string[] {
  return boxes.map(
    box => box.getAttribute('aria-label')!.replace('Sélectionner le critère ', ''),
  );
}

describe('App — actions groupées', () => {
  beforeEach(() => {
    localStorage.clear();
    seedAudit();
  });

  it('applique le statut à tous les critères sélectionnés, pas seulement au dernier', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    const boxes = firstThreeCheckboxes();
    const ids = idsOf(boxes);
    expect(ids).toHaveLength(3);

    for (const box of boxes) await user.click(box);

    const bar = screen.getByRole('region', { name: 'Actions groupées' });
    await user.click(within(bar).getByRole('button', { name: /Conforme/ }));

    const progress = storedProgress();
    for (const id of ids) {
      expect(progress[id]).toEqual({ status: 'conforme' });
    }
  });

  it('efface le statut de tous les critères sélectionnés', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    const boxes = firstThreeCheckboxes();
    const ids = idsOf(boxes);

    for (const box of boxes) await user.click(box);
    let bar = screen.getByRole('region', { name: 'Actions groupées' });
    await user.click(within(bar).getByRole('button', { name: /Conforme/ }));

    for (const box of firstThreeCheckboxes()) await user.click(box);
    bar = screen.getByRole('region', { name: 'Actions groupées' });
    await user.click(within(bar).getByRole('button', { name: 'Effacer le statut' }));

    const progress = storedProgress();
    for (const id of ids) {
      expect(progress[id]).toBeUndefined();
    }
  });

  it('répercute le lot entier sur le compteur de critères évalués', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    for (const box of firstThreeCheckboxes()) await user.click(box);

    const bar = screen.getByRole('region', { name: 'Actions groupées' });
    await user.click(within(bar).getByRole('button', { name: /Conforme/ }));

    expect(screen.getByText(/^3 \/ \d+ évalués$/)).toBeInTheDocument();
  });
});
