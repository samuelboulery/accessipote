import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScanImportPanel from './ScanImportPanel';
import type { Audit, CriteriaRGAA, ScanReport } from '../types';
import type { ScanPlanEntry } from '../utils/scanReport';

const criteriaList: CriteriaRGAA[] = [
  { id: '1.1', title: 'Image porteuse d’information', url: 'u', theme: 'Images', level: 'A' },
  { id: '2.1', title: 'Cadre avec titre', url: 'u', theme: 'Cadres', level: 'A' },
  { id: '8.3', title: 'Langue par défaut', url: 'u', theme: 'Éléments obligatoires', level: 'A' },
  { id: '9.1', title: 'Titres pertinents', url: 'u', theme: 'Structuration', level: 'A' },
];

const knownCriteriaIds = new Set(criteriaList.map(criterion => criterion.id));

const report = {
  schema: 1,
  scannedAt: '2026-08-20T10:00:00.000Z',
  urls: ['https://exemple.fr'],
  criteria: {
    '1.1': {
      verdict: 'fail',
      testVerdicts: { '1.1.1': 'fail' },
      evidence: [{ url: 'https://exemple.fr', selector: 'img#logo', snippet: '<img src="logo.png">' }],
    },
    '2.1': { verdict: 'na', testVerdicts: { '2.1.1': 'na' }, evidence: [] },
    '8.3': { verdict: 'pass', testVerdicts: { '8.3.1': 'pass' }, evidence: [] },
  },
} satisfies ScanReport;

const audit: Audit = {
  id: 'audit-1',
  name: 'Site vitrine',
  mode: 'classic',
  themes: [],
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
  progress: {},
  notes: {},
  pages: {},
  checkedTests: {},
};

function file(content: unknown): File {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return new File([text], 'scan-report.json', { type: 'application/json' });
}

function setup(overrides: Partial<React.ComponentProps<typeof ScanImportPanel>> = {}) {
  const onApply = vi.fn<(entries: ScanPlanEntry[], scannedAt: string) => void>();
  const onUndo = vi.fn<(criteriaId: string) => void>();
  const onClose = vi.fn();
  const view = render(
    <ScanImportPanel
      isOpen
      audit={audit}
      criteriaList={criteriaList}
      knownCriteriaIds={knownCriteriaIds}
      onApply={onApply}
      onUndo={onUndo}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { ...view, onApply, onUndo, onClose, user: userEvent.setup() };
}

function input(): HTMLInputElement {
  return screen.getByLabelText('Rapport de scan (JSON)') as HTMLInputElement;
}

describe('ScanImportPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ne rend rien quand il est fermé', () => {
    const { container } = setup({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('écrit les échecs et les non applicables prouvés dès l’import', async () => {
    const { onApply, user } = setup();
    await user.upload(input(), file(report));

    expect(onApply).toHaveBeenCalledTimes(1);
    const [entries, scannedAt] = onApply.mock.calls[0];
    expect(entries.map(entry => entry.criteriaId)).toEqual(['1.1', '2.1']);
    expect(entries[0].status).toBe('non-conforme');
    expect(entries[1].status).toBe('non-applicable');
    expect(scannedAt).toBe('2026-08-20T10:00:00.000Z');
  });

  it('n’écrit jamais un conforme proposé sans confirmation', async () => {
    const { onApply, user } = setup();
    await user.upload(input(), file(report));

    const applied = onApply.mock.calls[0][0];
    expect(applied.some(entry => entry.criteriaId === '8.3')).toBe(false);

    const toConfirm = screen.getByRole('group', { name: /à confirmer/i });
    expect(within(toConfirm).getByRole('listitem', { name: /8\.3/ })).toBeInTheDocument();

    await user.click(within(toConfirm).getByRole('button', { name: /tout accepter/i }));
    const [entries] = onApply.mock.calls[1];
    expect(entries.map(entry => entry.criteriaId)).toEqual(['8.3']);
    expect(entries[0].status).toBe('conforme');
  });

  it('affiche la preuve de chaque statut appliqué', async () => {
    const { user } = setup();
    await user.upload(input(), file(report));

    const section = screen.getByRole('group', { name: /appliqué/i });
    expect(within(section).getByText('https://exemple.fr')).toBeInTheDocument();
    expect(within(section).getByText('img#logo')).toBeInTheDocument();
    expect(within(section).getByText(/<img src="logo.png">/)).toBeInTheDocument();
  });

  it('annule un statut appliqué, ligne par ligne', async () => {
    const applied: Audit = {
      ...audit,
      progress: { '1.1': { status: 'non-conforme' }, '2.1': { status: 'non-applicable' } },
      auto: {
        '1.1': { status: 'non-conforme', testIds: ['1.1.1'], scannedAt: report.scannedAt, evidence: [] },
        '2.1': { status: 'non-applicable', testIds: ['2.1.1'], scannedAt: report.scannedAt, evidence: [] },
      },
    };
    const { onUndo, user } = setup({ audit: applied });
    await user.upload(input(), file(report));

    const section = screen.getByRole('group', { name: /appliqué/i });
    const row = within(section).getByRole('listitem', { name: /1\.1/ });
    await user.click(within(row).getByRole('button', { name: /annuler/i }));

    expect(onUndo).toHaveBeenCalledWith('1.1');
  });

  it('affiche le nombre de critères que le scan n’a pas regardés', async () => {
    const { user } = setup();
    await user.upload(input(), file(report));

    expect(screen.getByRole('group', { name: /non évalué/i })).toHaveTextContent('1');
  });

  it('rejette un fichier illisible sans toucher à l’audit', async () => {
    const { onApply, user } = setup();
    await user.upload(input(), file('ceci n’est pas du json'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/JSON/i);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('rejette un rapport d’un schéma inconnu', async () => {
    const { onApply, user } = setup();
    await user.upload(input(), file({ ...report, schema: 42 }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/schéma/i);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('rejette un rapport qui cite un critère inexistant', async () => {
    const { onApply, user } = setup();
    await user.upload(
      input(),
      file({ ...report, criteria: { '42.1': { verdict: 'fail', testVerdicts: {}, evidence: [] } } }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/42\.1/);
    expect(onApply).not.toHaveBeenCalled();
  });
});
