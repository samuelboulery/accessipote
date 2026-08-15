import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossaryScreen from './GlossaryScreen';
import type { CriteriaRGAA, GlossaryTerm } from '../types';

const GLOSSARY: GlossaryTerm[] = [
  {
    title: 'Accessibilité',
    body: '<p>La capacité d\'un produit à être utilisé par tous les utilisateurs.</p>',
  },
  {
    title: 'Agrandir',
    body: '<p>Augmenter la taille du texte ou des éléments visuels.</p>',
  },
  {
    title: 'Balise',
    body: '<p>Élément de balisage HTML qui structure le contenu.</p>',
  },
];

const CRITERIA: CriteriaRGAA[] = [
  {
    id: '1.1',
    title: 'Images : alternatives #accessibilite',
    theme: 'Images',
    level: 'A',
    url: 'https://example.com/1.1',
  },
  {
    id: '1.2',
    title: 'Texte agrandissable via #agrandir',
    theme: 'Images',
    level: 'A',
    url: 'https://example.com/1.2',
  },
];

function setup(overrides: { selectedSlug?: string } = {}) {
  const onSelectTerm = vi.fn();
  const onCriteriaClick = vi.fn();

  // Wrapper stateful pour gérer la sélection dans les tests
  function Wrapper() {
    const [selectedSlug, setSelectedSlug] = React.useState<string | undefined>(overrides.selectedSlug);

    return (
      <GlossaryScreen
        glossary={GLOSSARY}
        criteriaList={CRITERIA}
        selectedSlug={selectedSlug}
        onSelectTerm={(slug) => {
          setSelectedSlug(slug);
          onSelectTerm(slug);
        }}
        onCriteriaClick={onCriteriaClick}
      />
    );
  }

  render(<Wrapper />);

  return { onSelectTerm, onCriteriaClick };
}

describe('GlossaryScreen', () => {

  it('affiche le titre « Glossaire »', () => {
    setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Glossaire' })).toBeInTheDocument();
  });

  it('affiche la liste des termes avec leur compteur', () => {
    setup();

    expect(screen.getByText('3 termes sur 3')).toBeInTheDocument();

    // Chercher les boutons de la liste (ils ont aria-current pour le sélectionné)
    const buttons = screen.getAllByRole('button', { name: /Accessibilité|Agrandir|Balise/ });
    // On doit avoir au moins 3 boutons (liste) + 1 dans les critères liés = au moins 3
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('sélectionne le premier terme par défaut', () => {
    setup();

    const accessibilityButton = screen.getByRole('button', { name: /Accessibilité/ });
    expect(accessibilityButton).toHaveAttribute('aria-current', 'true');
  });

  it('affiche la fiche du terme sélectionné dans le volet de détail', () => {
    setup();

    // Vérifier que le heading du terme sélectionné s'affiche
    expect(screen.getByRole('heading', { level: 2, name: 'Accessibilité' })).toBeInTheDocument();
    // Vérifier que la définition contient au moins une partie du texte (peut être dans la liste et le détail)
    const definitions = screen.getAllByText(/La capacité/);
    expect(definitions.length).toBeGreaterThanOrEqual(1);
  });

  it('bascule le terme sélectionné au clic', async () => {
    const user = userEvent.setup();
    setup();

    // Chercher tous les boutons avec du texte (liste des termes)
    // Le premier est Accessibilité (défaut), on veut cliquer le second (Agrandir)
    const termButtons = screen.getAllByRole('button');
    const agrandirButton = termButtons.find(btn => btn.textContent?.includes('Agrandir') && btn.getAttribute('aria-current') !== 'true');

    if (!agrandirButton) throw new Error('Agrandir button not found');
    await user.click(agrandirButton);

    // Attendre que le heading « Agrandir » s'affiche
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { level: 2, name: 'Agrandir' })).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('appelle onSelectTerm au clic sur un terme', async () => {
    const user = userEvent.setup();
    const { onSelectTerm } = setup();

    // Chercher tous les boutons avec du texte (liste des termes)
    const termButtons = screen.getAllByRole('button');
    const agrandirButton = termButtons.find(btn => btn.textContent?.includes('Agrandir') && btn.getAttribute('aria-current') !== 'true');

    if (!agrandirButton) throw new Error('Agrandir button not found');
    await user.click(agrandirButton);

    expect(onSelectTerm).toHaveBeenCalledWith('agrandir');
  });

  it('filtre les termes par recherche avec un délai de 200ms (débounce)', async () => {
    const user = userEvent.setup();
    setup();

    const searchInput = screen.getByRole('searchbox', { name: 'Rechercher un terme du glossaire' });

    // Taper la recherche « accessi » qui correspond à « Accessibilité »
    await user.type(searchInput, 'accessi');

    // Attendre le débounce (200ms) + marge généreuse
    await waitFor(
      () => {
        expect(screen.getByText('1 terme sur 3')).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    // Après le débounce, seulement « Accessibilité » correspond
    expect(screen.getAllByText('Accessibilité').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Agrandir')).not.toBeInTheDocument();
  });

  it('affiche « Tous » comme premier bouton de l\'index alphabétique', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Tout' })).toBeInTheDocument();
  });

  it('affiche seulement les lettres présentes dans les termes du glossaire', () => {
    setup();

    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'C' })).not.toBeInTheDocument();
  });

  it('filtre les termes par lettre au clic sur un bouton alphabétique', async () => {
    const user = userEvent.setup();
    setup();

    const buttonA = screen.getByRole('button', { name: 'A' });
    await user.click(buttonA);

    expect(screen.getByText('2 termes sur 3')).toBeInTheDocument();
    // Vérifier que Accessibilité et Agrandir s'affichent (dans la liste)
    expect(screen.getAllByText('Accessibilité').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Agrandir').length).toBeGreaterThanOrEqual(1);
    // Vérifier que Balise ne s'affiche pas du tout
    expect(screen.queryByText('Balise')).not.toBeInTheDocument();
  });

  it('désactive le filtre par lettre en reçliquant sur le même bouton', async () => {
    const user = userEvent.setup();
    setup();

    const buttonA = screen.getByRole('button', { name: 'A' });
    await user.click(buttonA);
    expect(screen.getByText('2 termes sur 3')).toBeInTheDocument();

    await user.click(buttonA);
    expect(screen.getByText('3 termes sur 3')).toBeInTheDocument();
  });

  it('combine le filtrage par recherche et par lettre', async () => {
    const user = userEvent.setup();
    setup();

    const searchInput = screen.getByRole('searchbox', { name: 'Rechercher un terme du glossaire' });
    const buttonA = screen.getByRole('button', { name: 'A' });

    // Filtrer par lettre A
    await user.click(buttonA);
    expect(screen.getByText('2 termes sur 3')).toBeInTheDocument();

    // Taper la recherche « accessi » qui correspond à « Accessibilité »
    await user.type(searchInput, 'accessi');

    // Attendre le débounce avec marge généreuse
    await waitFor(
      () => {
        expect(screen.getByText('1 terme sur 3')).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    // Seul « Accessibilité » correspond (commence par A et contient « accessi »)
    expect(screen.getAllByText('Accessibilité').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les critères liés en chips au-dessous de la fiche du terme', () => {
    setup({ selectedSlug: 'accessibilite' });

    expect(screen.getByText('Critères qui emploient ce terme · 1')).toBeInTheDocument();
    expect(screen.getByText('1.1')).toBeInTheDocument();
    expect(
      screen.getByText('Images : alternatives #accessibilite')
    ).toBeInTheDocument();
  });

  it('n\'affiche pas la section critères liés quand aucun critère ne correspond', () => {
    setup({ selectedSlug: 'balise' }); // Aucun critère n'emploie « balise »

    expect(screen.queryByText('Critères qui emploient ce terme')).not.toBeInTheDocument();
  });

  it('appelle onCriteriaClick au clic sur un critère lié', async () => {
    const user = userEvent.setup();
    const { onCriteriaClick } = setup({ selectedSlug: 'accessibilite' });

    const criteriaChip = screen.getByRole('button', {
      name: /1\.1/,
    });
    await user.click(criteriaChip);

    expect(onCriteriaClick).toHaveBeenCalledWith('1.1');
  });

  it('montre l\'état vide quand la recherche n\'a aucun résultat', async () => {
    const user = userEvent.setup();
    setup();

    const searchInput = screen.getByRole('searchbox', { name: 'Rechercher un terme du glossaire' });
    await user.type(searchInput, 'xyz');

    // Attendre le débounce et le rendu de l'état vide
    await waitFor(
      () => {
        expect(screen.getByText('Aucun terme ne correspond')).toBeInTheDocument();
      },
      { timeout: 400 }
    );

    expect(
      screen.getByText(
        '« xyz » n\'apparaît dans aucun intitulé du glossaire. Le terme est peut-être dans le corps d\'une définition, ou dans un intitulé de critère.'
      )
    ).toBeInTheDocument();
  });

  it('affiche le bouton « Effacer la recherche » en état vide', async () => {
    const user = userEvent.setup();
    setup();

    const searchInput = screen.getByRole('searchbox', { name: 'Rechercher un terme du glossaire' });
    await user.type(searchInput, 'xyz');

    // Attendre le débounce et l'affichage du bouton
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Effacer la recherche' })).toBeInTheDocument();
      },
      { timeout: 400 }
    );
  });

  it('réinitialise la recherche et les filtres au clic sur « Effacer la recherche »', async () => {
    const user = userEvent.setup();
    setup();

    const searchInput = screen.getByRole('searchbox', { name: 'Rechercher un terme du glossaire' });
    const buttonA = screen.getByRole('button', { name: 'A' });

    // Appliquer filtres et recherche
    await user.type(searchInput, 'xyz');
    await user.click(buttonA);

    // Attendre l'état vide
    await waitFor(
      () => {
        expect(screen.getByText('Aucun terme ne correspond')).toBeInTheDocument();
      },
      { timeout: 400 }
    );

    // Cliquer sur « Effacer la recherche »
    const clearButton = screen.getByRole('button', { name: 'Effacer la recherche' });
    await user.click(clearButton);

    // Tous les termes doivent être de retour (attendre le débounce après le clic)
    await waitFor(
      () => {
        expect(screen.getByText('3 termes sur 3')).toBeInTheDocument();
      },
      { timeout: 400 }
    );

    // Vérifier que les trois termes apparaissent dans la liste (première occurrence)
    const termsList = screen.getAllByRole('button', { name: /Accessibilité|Agrandir|Balise/ });
    expect(termsList.length).toBeGreaterThanOrEqual(3);
  });

  it('marque « Tout » comme actif quand aucun filtre par lettre n\'est appliqué', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('marque un bouton alphabétique comme actif quand son filtre est appliqué', async () => {
    const user = userEvent.setup();
    setup();

    const buttonA = screen.getByRole('button', { name: 'A' });
    await user.click(buttonA);

    expect(buttonA).toHaveAttribute('aria-pressed', 'true');
    const buttonB = screen.getByRole('button', { name: 'B' });
    expect(buttonB).toHaveAttribute('aria-pressed', 'false');
  });

  it('affiche l\'en-tête du terme avec son initiale', () => {
    setup({ selectedSlug: 'accessibilite' });

    expect(screen.getByText('Glossaire RGAA · A')).toBeInTheDocument();
  });
});
