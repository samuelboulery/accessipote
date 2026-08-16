import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuditSwitcher, { type SwitchableAudit } from './AuditSwitcher';
import type { Audit } from '../types';

function makeAudit(id: string, name: string, mode: Audit['mode'] = 'classic'): Audit {
  return {
    id,
    name,
    mode,
    themes: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    progress: {},
    notes: {},
    pages: {},
    checkedTests: {},
  };
}

const actif = makeAudit('a', 'Site vitrine');
const autre = makeAudit('b', 'Intranet RH');

const audits: SwitchableAudit[] = [
  { audit: actif, evaluated: 89, total: 106 },
  { audit: autre, evaluated: 45, total: 106 },
];

function renderSwitcher(overrides: Partial<React.ComponentProps<typeof AuditSwitcher>> = {}) {
  const props = {
    activeAudit: actif,
    audits,
    onSelectAudit: vi.fn(),
    onSeeAllAudits: vi.fn(),
    onCreateAudit: vi.fn(),
    ...overrides,
  };
  render(<AuditSwitcher {...props} />);
  return props;
}

const ouvrir = () => fireEvent.click(screen.getByRole('button', { expanded: false }));

describe('AuditSwitcher', () => {
  it('annonce l\'audit courant et son mode sans ouvrir le panneau', () => {
    renderSwitcher();

    const declencheur = screen.getByRole('button', { expanded: false });
    expect(declencheur).toHaveAccessibleName(/Audit courant : Site vitrine/);
    expect(screen.getByText('Mode classique')).toBeInTheDocument();
    expect(screen.queryByText('Tes audits')).toBeNull();
  });

  it('libelle le mode design system', () => {
    renderSwitcher({ activeAudit: makeAudit('c', 'Bibliothèque', 'design-system') });

    expect(screen.getByText('Mode design system')).toBeInTheDocument();
  });

  it('ouvre puis referme le panneau au clic sur le déclencheur', () => {
    renderSwitcher();

    ouvrir();
    expect(screen.getByText('Tes audits')).toBeInTheDocument();
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { expanded: true }));
    expect(screen.queryByText('Tes audits')).toBeNull();
  });

  it('marque l\'audit actif par aria-current, pas seulement par un fond', () => {
    renderSwitcher();
    ouvrir();

    const lignes = screen.getAllByRole('button', { current: true });
    expect(lignes).toHaveLength(1);
    expect(lignes[0]).toHaveTextContent('Site vitrine');
  });

  it('bascule d\'audit et referme le panneau', () => {
    const { onSelectAudit } = renderSwitcher();
    ouvrir();

    fireEvent.click(screen.getByText('Intranet RH'));

    expect(onSelectAudit).toHaveBeenCalledWith('b');
    expect(screen.queryByText('Tes audits')).toBeNull();
  });

  it('affiche le ratio de chaque audit', () => {
    renderSwitcher();
    ouvrir();

    expect(screen.getByText('89 / 106')).toBeInTheDocument();
    expect(screen.getByText('45 / 106')).toBeInTheDocument();
  });

  it('déclenche « Voir tous les audits » puis referme', () => {
    const { onSeeAllAudits } = renderSwitcher();
    ouvrir();

    fireEvent.click(screen.getByText('Voir tous les audits'));

    expect(onSeeAllAudits).toHaveBeenCalled();
    expect(screen.queryByText('Tes audits')).toBeNull();
  });

  it('déclenche « Nouvel audit » puis referme', () => {
    const { onCreateAudit } = renderSwitcher();
    ouvrir();

    fireEvent.click(screen.getByText('Nouvel audit'));

    expect(onCreateAudit).toHaveBeenCalled();
    expect(screen.queryByText('Tes audits')).toBeNull();
  });

  it('referme sur Échap', () => {
    renderSwitcher();
    ouvrir();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Tes audits')).toBeNull();
  });

  it('ignore les autres touches', () => {
    renderSwitcher();
    ouvrir();

    fireEvent.keyDown(document, { key: 'a' });

    expect(screen.getByText('Tes audits')).toBeInTheDocument();
  });

  it('referme sur un clic à l\'extérieur', () => {
    renderSwitcher();
    ouvrir();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Tes audits')).toBeNull();
  });

  it('reste ouvert sur un clic à l\'intérieur', () => {
    renderSwitcher();
    ouvrir();

    fireEvent.mouseDown(screen.getByText('Tes audits'));

    expect(screen.getByText('Tes audits')).toBeInTheDocument();
  });
});
