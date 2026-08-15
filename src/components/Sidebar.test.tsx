import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import type { Audit } from '../types';
import type { SwitchableAudit } from './AuditSwitcher';

const AUDIT: Audit = {
  id: 'a1',
  name: 'Refonte lamairie.fr',
  mode: 'classic',
  themes: [],
  createdAt: '2026-08-15T10:00:00.000Z',
  updatedAt: '2026-08-15T10:00:00.000Z',
  progress: {},
  notes: {},
  pages: {},
  checkedTests: {},
};

const COUNTS = { conforme: 29, ecarts: 12, nonApplicable: 7, aEvaluer: 58 };

const AUDITS: SwitchableAudit[] = [
  {
    audit: AUDIT,
    evaluated: 48,
    total: 106,
  },
];

function setup(overrides = {}) {
  const onNavigate = vi.fn();
  const onSelectAudit = vi.fn();
  const onCreateAudit = vi.fn();
  const onCycleTheme = vi.fn();
  render(
    <Sidebar
      view="audit"
      onNavigate={onNavigate}
      activeAudit={AUDIT}
      counts={COUNTS}
      total={106}
      audits={AUDITS}
      onSelectAudit={onSelectAudit}
      onCreateAudit={onCreateAudit}
      themeMode="light"
      onCycleTheme={onCycleTheme}
      {...overrides}
    />,
  );
  return { onNavigate, onSelectAudit, onCreateAudit, onCycleTheme };
}

describe('Sidebar', () => {
  it('nomme chaque destination par son contenu', () => {
    setup();
    for (const label of ['Accueil', 'Audit', 'Synthèse', 'Glossaire']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('marque la destination courante avec aria-current', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Audit' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Accueil' })).not.toHaveAttribute('aria-current');
  });

  it('remonte la navigation demandée', async () => {
    const user = userEvent.setup();
    const { onNavigate } = setup();

    await user.click(screen.getByRole('button', { name: 'Synthèse' }));

    expect(onNavigate).toHaveBeenCalledWith('summary');
  });

  it('écrit le ratio en chiffres à côté de l\'anneau, jamais dans l\'anneau seul', () => {
    setup();

    expect(screen.getByText('48 / 106')).toBeInTheDocument();
    expect(screen.getByText('critères évalués')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /45 % des critères évalués/ })).toBeInTheDocument();
  });

  it('détaille la répartition en quatre lignes chiffrées', () => {
    setup();

    expect(screen.getByText('Conforme')).toBeInTheDocument();
    expect(screen.getByText('Non conforme')).toBeInTheDocument();
    expect(screen.getByText('Non applicable')).toBeInTheDocument();
    expect(screen.getByText('À évaluer')).toBeInTheDocument();
    expect(screen.getByText('29')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
  });

  it('affiche le sélecteur d\'audit avec son mode en lecture', async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByText('Mode classique')).toBeInTheDocument();
    const auditButton = screen.getByRole('button', { name: /Audit courant : Refonte lamairie\.fr/ });
    await user.click(auditButton);

    // Le popover s'ouvre après clic
    expect(screen.getByText('Tes audits')).toBeInTheDocument();
  });

  it('masque le sélecteur et la carte d\'audit quand aucun audit n\'est actif', () => {
    setup({ activeAudit: null });

    expect(screen.queryByText('Cet audit')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accueil' })).toBeInTheDocument();
  });

  it('annonce l\'état de sauvegarde plutôt que de le laisser deviner', () => {
    setup();
    expect(screen.getByText(/Enregistré/)).toBeInTheDocument();
  });

  it('affiche la bascule clair/sombre au pied de la barre', async () => {
    const user = userEvent.setup();
    const { onCycleTheme } = setup();

    const toggleButton = screen.getByRole('button', { name: /Thème :/ });
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    expect(onCycleTheme).toHaveBeenCalled();
  });

  it('tient l\'indicateur de sauvegarde sur une seule ligne', () => {
    setup();
    // Sur deux lignes, la coche se retrouvait centrée entre les deux au lieu
    // de s'aligner sur la première.
    expect(screen.getByText(/Enregistré/)).toHaveClass('truncate');
  });
});
