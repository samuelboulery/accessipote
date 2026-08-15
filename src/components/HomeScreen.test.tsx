import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeScreen, { type AuditSummary } from './HomeScreen';
import type { Audit } from '../types';

const AUDITS: AuditSummary[] = [
  {
    audit: {
      id: 'a1',
      name: 'Refonte lamairie.fr',
      mode: 'classic',
      themes: [],
      createdAt: '2026-08-10T10:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
      progress: {},
      notes: {},
      pages: {},
      checkedTests: {},
    } as Audit,
    evaluated: 48,
    total: 106,
  },
  {
    audit: {
      id: 'a2',
      name: 'API v2',
      mode: 'design-system',
      themes: [],
      createdAt: '2026-08-12T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
      progress: {},
      notes: {},
      pages: {},
      checkedTests: {},
    } as Audit,
    evaluated: 80,
    total: 106,
  },
];

function setup(overrides = {}) {
  const onOpenAudit = vi.fn();
  const onCreateAudit = vi.fn();
  const onOpenGlossary = vi.fn();
  render(
    <HomeScreen
      audits={AUDITS}
      glossaryCount={284}
      criteriaCount={106}
      onOpenAudit={onOpenAudit}
      onCreateAudit={onCreateAudit}
      onOpenGlossary={onOpenGlossary}
      {...overrides}
    />,
  );
  return { onOpenAudit, onCreateAudit, onOpenGlossary };
}

describe('HomeScreen', () => {
  it('affiche le sur-titre RGAA 4.1 sans logo ni mot-symbole', () => {
    setup();
    expect(screen.getByText('RGAA 4.1')).toBeInTheDocument();
    expect(screen.queryByText('Accessipote')).not.toBeInTheDocument();
  });

  it('affiche le titre principal', () => {
    setup();
    expect(screen.getByText('Auditer l\'accessibilité sans perdre le fil.')).toBeInTheDocument();
  });

  it('affiche l\'accroche avec le nombre de critères', () => {
    setup();
    expect(screen.getByText(/Les 106 critères du RGAA/)).toBeInTheDocument();
  });

  it('affiche le sous-titre « Vos audits » quand des audits existent', () => {
    setup({ audits: [AUDITS[0]] });
    expect(screen.getByText('Vos audits')).toBeInTheDocument();
  });

  it('n\'affiche pas le sous-titre « Vos audits » quand aucun audit n\'existe', () => {
    setup({ audits: [] });
    expect(screen.queryByText('Vos audits')).not.toBeInTheDocument();
  });

  it('masque la liste d\'audits quand elle est vide', () => {
    setup({ audits: [] });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('affiche la liste d\'audits avec leurs noms', () => {
    setup();
    expect(screen.getByText('Refonte lamairie.fr')).toBeInTheDocument();
    expect(screen.getByText('API v2')).toBeInTheDocument();
  });

  it('affiche le pourcentage d\'évaluation en chiffres, jamais dans l\'anneau seul', () => {
    setup();
    expect(screen.getByRole('img', { name: /45 % évalué/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /75 % évalué/ })).toBeInTheDocument();
  });

  it('affiche le ratio évalués/total pour chaque audit', () => {
    setup();
    expect(screen.getByText(/48/)).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });

  it('affiche le libellé du mode en lecture seule', () => {
    setup();
    expect(screen.getByText(/Mode classique/)).toBeInTheDocument();
    expect(screen.getByText(/Mode design system/)).toBeInTheDocument();
  });

  it('appelle onOpenAudit au clic sur un audit', async () => {
    const user = userEvent.setup();
    const { onOpenAudit } = setup();

    await user.click(screen.getByText('Refonte lamairie.fr'));

    expect(onOpenAudit).toHaveBeenCalledWith('a1');
  });

  it('affiche le bouton « Nouvel audit » quand des audits existent', () => {
    setup({ audits: [AUDITS[0]] });
    expect(screen.getByRole('button', { name: 'Nouvel audit' })).toBeInTheDocument();
  });

  it('affiche le bouton « Démarrer un premier audit » quand aucun audit n\'existe', () => {
    setup({ audits: [] });
    expect(screen.getByRole('button', { name: 'Démarrer un premier audit' })).toBeInTheDocument();
  });

  it('appelle onCreateAudit au clic sur le bouton de création', async () => {
    const user = userEvent.setup();
    const { onCreateAudit } = setup();

    await user.click(screen.getByRole('button', { name: 'Nouvel audit' }));

    expect(onCreateAudit).toHaveBeenCalled();
  });

  it('affiche le bouton Glossaire avec le nombre de définitions', () => {
    setup();
    expect(screen.getByRole('button', { name: /Glossaire/ })).toBeInTheDocument();
    expect(screen.getByText('284')).toBeInTheDocument();
  });

  it('appelle onOpenGlossary au clic sur le glossaire', async () => {
    const user = userEvent.setup();
    const { onOpenGlossary } = setup();

    const glossaryButton = screen.getByRole('button', { name: /Glossaire/ });
    await user.click(glossaryButton);

    expect(onOpenGlossary).toHaveBeenCalled();
  });

  it('n\'affiche pas la carte « Importer un rapport »', () => {
    setup();
    expect(screen.queryByText(/Importer un rapport/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bientôt disponible/)).not.toBeInTheDocument();
  });

  it('affiche la date relative de modification pour chaque audit', () => {
    setup();
    expect(screen.getByText(/modifié il y a/)).toBeInTheDocument();
  });
});
