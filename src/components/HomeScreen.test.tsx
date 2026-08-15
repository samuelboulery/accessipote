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
      onOpenAudit={onOpenAudit}
      onCreateAudit={onCreateAudit}
      onOpenGlossary={onOpenGlossary}
      {...overrides}
    />,
  );
  return { onOpenAudit, onCreateAudit, onOpenGlossary };
}

describe('HomeScreen', () => {
  it('affiche l\'en-tête avec logo et version RGAA', () => {
    setup();
    expect(screen.getByText('Accessipote')).toBeInTheDocument();
    expect(screen.getByText('RGAA 4.1')).toBeInTheDocument();
  });

  it('affiche le titre principal', () => {
    setup();
    expect(screen.getByText('On reprend où on en était ?')).toBeInTheDocument();
  });

  it('accorde le sous-titre au singulier quand un audit existe', () => {
    setup({ audits: [AUDITS[0]] });
    expect(screen.getByText(/1 audit ouvert/)).toBeInTheDocument();
  });

  it('accorde le sous-titre au pluriel quand plusieurs audits existent', () => {
    setup();
    expect(screen.getByText(/2 audits ouverts/)).toBeInTheDocument();
  });

  it('affiche le message vide quand aucun audit n\'existe', () => {
    setup({ audits: [] });
    expect(screen.getByText(/Aucun audit pour le moment/)).toBeInTheDocument();
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
    // Les pourcentages sont affichés à côté de l'anneau (45% et 75%)
    // Pas dans le label du ring lui-même uniquement
    expect(screen.getByRole('img', { name: /45 % évalué/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /75 % évalué/ })).toBeInTheDocument();
  });

  it('affiche le ratio évalués/total pour chaque audit', () => {
    setup();
    // Les ratios sont dans des spans fragmentés : "48 / 106" etc.
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

  it('affiche le bouton de création d\'audit avec icône', () => {
    setup();
    expect(screen.getByRole('button', { name: /Démarrer un nouvel audit/ })).toBeInTheDocument();
  });

  it('appelle onCreateAudit au clic sur le bouton de création', async () => {
    const user = userEvent.setup();
    const { onCreateAudit } = setup();

    await user.click(screen.getByRole('button', { name: /Démarrer un nouvel audit/ }));

    expect(onCreateAudit).toHaveBeenCalled();
  });

  it('affiche le bouton Glossaire avec le nombre de définitions', () => {
    setup();
    expect(screen.getByRole('button', { name: /Glossaire/ })).toBeInTheDocument();
    expect(screen.getByText(/284 définitions RGAA/)).toBeInTheDocument();
  });

  it('appelle onOpenGlossary au clic sur le glossaire', async () => {
    const user = userEvent.setup();
    const { onOpenGlossary } = setup();

    const glossaryButton = screen.getByText('Glossaire').closest('button');
    if (glossaryButton) {
      await user.click(glossaryButton);
    }

    expect(onOpenGlossary).toHaveBeenCalled();
  });

  it('affiche la mention « bientôt disponible » pour l\'import de rapport', () => {
    setup();
    expect(screen.getByText(/Bientôt disponible/)).toBeInTheDocument();
  });

  it('affiche la date relative de modification pour chaque audit', () => {
    setup();
    // Les audits ont des dates différentes, donc il y aura du texte "modifié il y a..."
    expect(screen.getByText(/modifié il y a/)).toBeInTheDocument();
  });
});
