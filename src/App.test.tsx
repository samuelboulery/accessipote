import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AUDITS_STORAGE_KEY } from './constants';
import type { Audit, AuditStore } from './types';

/**
 * Test d'intégration du chemin réel : le clic jusqu'au localStorage. Les tests
 * de `AuditScreen` espionnent `onStatusChange` avec un mock ; ils passaient
 * pendant que les actions groupées ne marquaient qu'un critère sur N, parce que
 * la faute était en aval du composant, dans les closures de rendu de `App` et
 * de `useLocalStorage`.
 */
const AUDIT_ID = 'audit-de-test';

function seedAudit(
  overrides: Partial<Audit> = {},
  storeOverrides: Partial<AuditStore> = {},
) {
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
        ...overrides,
      },
    ],
    activeAuditId: AUDIT_ID,
    ...storeOverrides,
  };
  localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(store));
}

/** Bascule `useIsMobile` : c'est `matchMedia` qui décide, pas une prop. */
function setViewport(mobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: mobile,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
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

describe('App — cycle de vie d\'un audit', () => {
  beforeEach(() => {
    localStorage.clear();
    setViewport(false);
  });

  it('crée un audit depuis l\'accueil et bascule sur sa vue d\'audit', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Démarrer un premier audit/ }));

    await user.type(screen.getByLabelText('Nom de l\'audit'), 'Site vitrine');
    await user.click(screen.getByRole('checkbox', { name: 'Images' }));
    await user.click(screen.getByRole('button', { name: 'Créer l\'audit' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Images' })).toBeInTheDocument();
    expect(screen.getByText('Audit « Site vitrine » créé.')).toBeInTheDocument();

    // Périmètre restreint : seul le thème coché est auditable.
    const store = JSON.parse(localStorage.getItem(AUDITS_STORAGE_KEY)!) as AuditStore;
    expect(store.audits[0].themes).toEqual(['Images']);
  });

  it('retient tous les thèmes quand aucun n\'est coché', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Démarrer un premier audit/ }));
    await user.type(screen.getByLabelText('Nom de l\'audit'), 'Audit complet');
    await user.click(screen.getByRole('button', { name: 'Créer l\'audit' }));

    const store = JSON.parse(localStorage.getItem(AUDITS_STORAGE_KEY)!) as AuditStore;
    expect(store.audits[0].themes).toEqual([]);
    expect(screen.getByRole('heading', { level: 1, name: 'Images' })).toBeInTheDocument();
  });

  it('ouvre un audit sur un thème de son périmètre, pas sur le premier du RGAA', async () => {
    const user = userEvent.setup();
    seedAudit({ themes: ['Cadres'] });
    render(<App />);

    await openAudit(user);

    // Le thème actif par défaut est « Images », hors périmètre : l'écran doit
    // retomber sur le premier thème réellement audité.
    expect(screen.getByRole('heading', { level: 1, name: 'Cadres' })).toBeInTheDocument();
  });

  it('annonce la suppression d\'un audit depuis l\'accueil', async () => {
    const user = userEvent.setup();
    seedAudit();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Accueil' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer l\'audit Audit de test' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(screen.getByText('Audit « Audit de test » supprimé.')).toBeInTheDocument();
    const store = JSON.parse(localStorage.getItem(AUDITS_STORAGE_KEY)!) as AuditStore;
    expect(store.audits).toHaveLength(0);
  });

  it('rouvre un audit depuis l\'accueil', async () => {
    const user = userEvent.setup();
    seedAudit({}, { activeAuditId: null });
    render(<App />);

    const main = within(screen.getByRole('main'));
    await user.click(main.getByRole('button', { name: /Audit de test.*modifié/ }));

    expect(screen.getByRole('heading', { level: 1, name: 'Images' })).toBeInTheDocument();
  });
});

describe('App — navigation entre les vues', () => {
  beforeEach(() => {
    localStorage.clear();
    setViewport(false);
  });

  it('affiche la synthèse de l\'audit actif', async () => {
    const user = userEvent.setup();
    seedAudit({ progress: { '1.1': { status: 'conforme' } } });
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Synthèse' }));

    expect(screen.getByRole('heading', { level: 1, name: /Synthèse/ })).toBeInTheDocument();
  });

  it('ouvre la définition d\'un terme cité dans un intitulé de critère', async () => {
    const user = userEvent.setup();
    seedAudit();
    render(<App />);
    await openAudit(user);

    await user.click(
      screen.getAllByRole('button', {
        name: 'Voir la définition de alternative textuelle dans le glossaire',
      })[0],
    );

    const popover = screen.getByRole('dialog', { name: /^Définition : / });
    await user.click(within(popover).getByRole('button', { name: 'Fermer la définition' }));

    expect(screen.queryByRole('dialog', { name: /^Définition : / })).not.toBeInTheDocument();
  });

  it('affiche le glossaire', async () => {
    const user = userEvent.setup();
    seedAudit();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Glossaire' }));

    expect(screen.getByRole('heading', { level: 1, name: /Glossaire/ })).toBeInTheDocument();
  });

  it('renvoie vers l\'accueil quand aucun audit n\'est ouvert', async () => {
    const user = userEvent.setup();
    seedAudit({}, { activeAuditId: null });
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Audit' }));
    expect(screen.getByText('Aucun audit ouvert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Synthèse' }));
    expect(screen.getByText('Aucun audit ouvert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Choisir un audit' }));
    expect(
      within(screen.getByRole('main')).getByRole('button', { name: /Audit de test.*modifié/ }),
    ).toBeInTheDocument();
  });

  it('propose de démarrer un premier audit quand le magasin est vide', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Audit' }));
    expect(screen.getByText('Rien à évaluer pour l\'instant')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Démarrer un premier audit/ }));
    expect(screen.getByLabelText('Nom de l\'audit')).toBeInTheDocument();
  });
});

describe('App — comptes de la barre latérale', () => {
  beforeEach(() => {
    localStorage.clear();
    setViewport(false);
  });

  it('ventile les statuts de l\'audit actif', () => {
    seedAudit({
      progress: {
        '1.1': { status: 'conforme' },
        '1.2': { status: 'non-conforme' },
        '1.3': { status: 'non-applicable' },
      },
    });
    render(<App />);

    // La barre latérale ventile les trois statuts et le reste à évaluer.
    const panel = screen.getByRole('heading', { name: 'Cet audit' }).parentElement!;
    const lines = within(panel)
      .getAllByRole('listitem')
      .map(item => item.textContent);
    expect(lines).toEqual([
      'Conforme1',
      'Non conforme1',
      'Non applicable1',
      'À évaluer103',
    ]);
  });
});

describe('App — mobile', () => {
  beforeEach(() => {
    localStorage.clear();
    setViewport(true);
  });

  it('remplace la barre latérale par les barres haute et basse', () => {
    seedAudit();
    render(<App />);

    // La barre latérale porte la ventilation des statuts ; la barre d'onglets
    // ne porte que la navigation.
    expect(screen.queryByRole('heading', { name: 'Cet audit' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
    expect(screen.getByText('Accessipote')).toBeInTheDocument();
  });
});

/**
 * Le chemin réel de l'import : un fichier lu, des statuts écrits dans le
 * magasin, une provenance qui ne survit pas à une reprise en main. Les tests du
 * panneau espionnent des callbacks ; ceux-ci vérifient ce qui finit sur disque.
 */
describe('App — import d’un rapport de scan', () => {
  const report = {
    schema: 1,
    scannedAt: '2026-08-20T10:00:00.000Z',
    urls: ['https://exemple.fr'],
    criteria: {
      '2.1': {
        verdict: 'fail',
        testVerdicts: { '2.1.1': 'fail' },
        evidence: [{ url: 'https://exemple.fr', selector: 'iframe', snippet: '<iframe src="x">' }],
      },
      '5.4': { verdict: 'na', testVerdicts: { '5.4.1': 'na' }, evidence: [] },
      '8.3': { verdict: 'pass', testVerdicts: { '8.3.1': 'pass' }, evidence: [] },
      '9.1': {
        verdict: 'suspect',
        testVerdicts: { '9.1.1': 'suspect' },
        evidence: [{ url: 'https://exemple.fr', selector: 'h3', snippet: '<h3>' }],
      },
    },
  };

  function storedAudit(): Audit {
    const store = JSON.parse(localStorage.getItem(AUDITS_STORAGE_KEY) ?? '{}') as AuditStore;
    return store.audits.find(audit => audit.id === AUDIT_ID)!;
  }

  async function importReport(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /importer un scan/i }));
    await user.upload(
      screen.getByLabelText('Rapport de scan (JSON)'),
      new File([JSON.stringify(report)], 'scan.json', { type: 'application/json' }),
    );
  }

  beforeEach(() => {
    localStorage.clear();
    setViewport(false);
  });

  it('écrit les échecs et les non applicables prouvés, jamais les conforme proposés', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);
    await importReport(user);

    const audit = storedAudit();
    expect(audit.progress['2.1']).toEqual({ status: 'non-conforme' });
    expect(audit.progress['5.4']).toEqual({ status: 'non-applicable' });
    expect(audit.progress['8.3']).toBeUndefined();
    expect(audit.auto?.['2.1'].evidence[0].selector).toBe('iframe');
    expect(audit.auto?.['2.1'].testIds).toEqual(['2.1.1']);
  });

  it('n’écrit rien quand le rapport est refusé', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    await user.click(screen.getByRole('button', { name: /importer un scan/i }));
    await user.upload(
      screen.getByLabelText('Rapport de scan (JSON)'),
      new File(['{ pas du json'], 'scan.json', { type: 'application/json' }),
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(storedAudit().progress).toEqual({});
  });

  it('oublie la provenance dès que l’auditeur reprend la main sur le statut', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);
    await importReport(user);

    const row = screen.getByRole('listitem', { name: 'Critère 2.1' });
    await user.click(within(row).getByRole('button', { name: /annuler/i }));

    const audit = storedAudit();
    expect(audit.progress['2.1']).toBeUndefined();
    expect(audit.auto?.['2.1']).toBeUndefined();
  });

  it('ne propose pas l’import sur un audit en mode design system', async () => {
    seedAudit({ mode: 'design-system' });
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    expect(screen.queryByRole('button', { name: /importer un scan/i })).not.toBeInTheDocument();
  });

  it('n’écrit pas un soupçon à l’import', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);
    await importReport(user);

    const audit = storedAudit();
    expect(audit.progress['9.1']).toBeUndefined();
    expect(audit.auto?.['9.1']).toBeUndefined();
  });

  it('écrit un soupçon accepté, et sa provenance dit qu’il vient d’un indice', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);
    await importReport(user);

    const section = screen.getByRole('group', { name: /à vérifier/i });
    const row = within(section).getByRole('listitem', { name: 'Critère 9.1' });
    await user.click(within(row).getByRole('button', { name: /appliquer/i }));

    const audit = storedAudit();
    expect(audit.progress['9.1']).toEqual({ status: 'non-conforme' });
    expect(audit.auto?.['9.1'].fromHint).toBe(true);
    expect(audit.auto?.['9.1'].evidence[0].selector).toBe('h3');
  });

  it('oublie la provenance d’un soupçon dès que l’auditeur reprend la main', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);
    await importReport(user);

    const section = screen.getByRole('group', { name: /à vérifier/i });
    const row = within(section).getByRole('listitem', { name: 'Critère 9.1' });
    await user.click(within(row).getByRole('button', { name: /appliquer/i }));
    await user.click(within(row).getByRole('button', { name: /annuler/i }));

    expect(storedAudit().auto?.['9.1']).toBeUndefined();
  });
});

/**
 * L'extension ne parle pas au magasin : elle poste un message, l'app le valide
 * comme elle validerait un fichier. Un message n'est jamais plus digne de
 * confiance qu'un fichier déposé — c'est tout l'enjeu de ces tests.
 */
describe('App — rapport reçu de l’extension', () => {
  function storedAudit(): Audit {
    const store = JSON.parse(localStorage.getItem(AUDITS_STORAGE_KEY) ?? '{}') as AuditStore;
    return store.audits.find(audit => audit.id === AUDIT_ID)!;
  }

  const scanReport = {
    schema: 2,
    scannedAt: '2026-08-21T10:00:00.000Z',
    urls: ['https://exemple.fr'],
    criteria: {
      '2.1': {
        verdict: 'fail',
        testVerdicts: { '2.1.1': 'fail' },
        evidence: [{ url: 'https://exemple.fr', selector: 'iframe', snippet: '<iframe>' }],
      },
      '5.4': { verdict: 'na', testVerdicts: { '5.4.1': 'na' }, evidence: [] },
    },
  };

  function post(payload: unknown, origin = window.location.origin): void {
    window.dispatchEvent(
      new MessageEvent('message', { data: payload, origin, source: window }),
    );
  }

  const fromExtension = (report: unknown) => ({
    source: 'accessipote-scan',
    report: typeof report === 'string' ? report : JSON.stringify(report),
  });

  beforeEach(() => {
    localStorage.clear();
    setViewport(false);
  });

  it('ouvre l’écran de revue et écrit ce qui est prouvé', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    await act(async () => post(fromExtension(scanReport)));

    expect(await screen.findByRole('group', { name: /non conformes/i })).toBeInTheDocument();
    expect(storedAudit().progress['2.1']).toEqual({ status: 'non-conforme' });
    expect(storedAudit().auto?.['2.1'].evidence[0].selector).toBe('iframe');
  });

  it('refuse un message venu d’une autre origine, sans rien écrire', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    await act(async () => post(fromExtension(scanReport), 'https://malveillant.example'));

    expect(screen.queryByRole('group', { name: /non conformes/i })).not.toBeInTheDocument();
    expect(storedAudit().progress).toEqual({});
  });

  it('ignore un message qui ne vient pas du scan', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    await act(async () => post({ source: 'autre-chose', report: JSON.stringify(scanReport) }));

    expect(storedAudit().progress).toEqual({});
  });

  it('dit qu’un rapport illisible est refusé, et n’écrit rien', async () => {
    seedAudit();
    const user = userEvent.setup();
    render(<App />);
    await openAudit(user);

    await act(async () => post(fromExtension('{ pas du json')));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(storedAudit().progress).toEqual({});
  });
});
