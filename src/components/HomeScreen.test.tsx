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
  const onDeleteAudit = vi.fn();
  render(
    <HomeScreen
      audits={AUDITS}
      glossaryCount={284}
      criteriaCount={106}
      themeCount={13}
      onOpenAudit={onOpenAudit}
      onCreateAudit={onCreateAudit}
      onDeleteAudit={onDeleteAudit}
      {...overrides}
    />,
  );
  return { onOpenAudit, onCreateAudit, onDeleteAudit };
}

describe('HomeScreen', () => {
  it('affiche le sur-titre RGAA 4.1 sans logo ni mot-symbole', () => {
    setup();
    expect(screen.getByText('RGAA 4.1')).toBeInTheDocument();
    expect(screen.queryByText('Accessipote')).not.toBeInTheDocument();
  });

  it('affiche le titre principal', () => {
    setup();
    expect(screen.getByText('Ton pote qui connaît le RGAA par cœur.')).toBeInTheDocument();
  });

  it('affiche l\'accroche avec le nombre de critères', () => {
    setup();
    expect(screen.getByText(/Les 106 critères/)).toBeInTheDocument();
  });

  it('affiche le sous-titre « Tes audits » quand des audits existent', () => {
    setup({ audits: [AUDITS[0]] });
    expect(screen.getByText('Tes audits')).toBeInTheDocument();
  });

  it('garde le sous-titre « Tes audits » même sans audit', () => {
    // La colonne conserve son en-tête : l'invitation prend la place de la
    // liste, elle ne laisse pas un creux.
    setup({ audits: [] });
    expect(screen.getByText('Tes audits')).toBeInTheDocument();
  });

  it('remplace la liste par une invitation quand aucun audit n\'existe', () => {
    setup({ audits: [] });

    expect(screen.getByText(/Aucun audit pour l'instant/)).toBeInTheDocument();
    expect(screen.getByText(/106 critères à statuer/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Supprimer l'audit/ })).not.toBeInTheDocument();
  });

  it('retire l\'invitation dès qu\'un audit existe', () => {
    setup({ audits: [AUDITS[0]] });
    expect(screen.queryByText(/Aucun audit pour l'instant/)).not.toBeInTheDocument();
  });

  it('crée un audit depuis l\'invitation', async () => {
    const user = userEvent.setup();
    const { onCreateAudit } = setup({ audits: [] });

    await user.click(screen.getByRole('button', { name: /Démarrer un premier audit/ }));

    expect(onCreateAudit).toHaveBeenCalled();
  });

  it('donne le poids du référentiel en chiffres', () => {
    setup();

    expect(screen.getByText('106')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('thèmes')).toBeInTheDocument();
    expect(screen.getByText('définitions')).toBeInTheDocument();
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



  it('n\'affiche pas la carte « Importer un rapport »', () => {
    setup();
    expect(screen.queryByText(/Importer un rapport/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bientôt disponible/)).not.toBeInTheDocument();
  });

  it('affiche la date relative de modification pour chaque audit', () => {
    setup();
    expect(screen.getByText(/modifié il y a/)).toBeInTheDocument();
  });

  describe('Suppression d\'un audit', () => {
    it('propose de supprimer chaque audit', () => {
      setup();
      expect(
        screen.getByRole('button', { name: "Supprimer l'audit Refonte lamairie.fr" }),
      ).toBeInTheDocument();
    });

    it('demande confirmation avant de supprimer', async () => {
      const user = userEvent.setup();
      const { onDeleteAudit } = setup();

      await user.click(
        screen.getByRole('button', { name: "Supprimer l'audit Refonte lamairie.fr" }),
      );

      // Rien n'est supprimé au premier clic : c'est irréversible.
      expect(onDeleteAudit).not.toHaveBeenCalled();
      expect(screen.getByText(/Supprimer « Refonte lamairie.fr » ?/)).toBeInTheDocument();
    });

    it('annonce que la perte est définitive', async () => {
      const user = userEvent.setup();
      setup();

      await user.click(
        screen.getByRole('button', { name: "Supprimer l'audit Refonte lamairie.fr" }),
      );

      expect(screen.getByText(/Rien ne permet de les récupérer/)).toBeInTheDocument();
    });

    it('supprime après confirmation', async () => {
      const user = userEvent.setup();
      const { onDeleteAudit } = setup();

      await user.click(
        screen.getByRole('button', { name: "Supprimer l'audit Refonte lamairie.fr" }),
      );
      await user.click(screen.getByRole('button', { name: 'Supprimer' }));

      expect(onDeleteAudit).toHaveBeenCalledWith('a1');
    });

    it('renonce à la suppression sur Annuler', async () => {
      const user = userEvent.setup();
      const { onDeleteAudit } = setup();

      await user.click(
        screen.getByRole('button', { name: "Supprimer l'audit Refonte lamairie.fr" }),
      );
      await user.click(screen.getByRole('button', { name: 'Annuler' }));

      expect(onDeleteAudit).not.toHaveBeenCalled();
      expect(screen.queryByText(/Supprimer « Refonte/)).not.toBeInTheDocument();
    });

    it('ne met en confirmation que l\'audit visé', async () => {
      const user = userEvent.setup();
      setup();

      await user.click(
        screen.getByRole('button', { name: "Supprimer l'audit Refonte lamairie.fr" }),
      );

      // Le second audit garde son bouton de suppression : il n'est pas entré
      // en confirmation avec le premier.
      expect(
        screen.getByRole('button', { name: "Supprimer l'audit API v2" }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Supprimer « API v2 »/)).not.toBeInTheDocument();
    });
  });

  it('range les audits en grille plutôt qu\'en pile pleine largeur', () => {
    setup();
    // Ici la classe EST le comportement demandé : deux colonnes sur grand
    // écran, avec passage à la ligne.
    const liste = screen
      .getByRole('button', { name: "Supprimer l'audit Refonte lamairie.fr" })
      .closest('ul');
    expect(liste).toHaveClass('grid');
    expect(liste).toHaveClass('xl:grid-cols-2');
  });

  it('ne double pas le glossaire, que la barre latérale porte déjà', () => {
    setup();
    expect(screen.queryByRole('button', { name: /Glossaire/ })).not.toBeInTheDocument();
    // Le nombre de définitions reste, mais comme chiffre, pas comme bouton.
    expect(screen.getByText('définitions')).toBeInTheDocument();
  });
});
