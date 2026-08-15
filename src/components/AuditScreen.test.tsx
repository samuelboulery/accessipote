import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditScreen from './AuditScreen';
import type { Audit, CriteriaRGAA, CriteriaFilters } from '../types';

const CRITERIA: CriteriaRGAA[] = [
  {
    id: '1.1',
    title: 'Images : alternatives textuelles',
    theme: 'Images',
    level: 'A',
    url: 'https://example.com/1.1',
  },
  {
    id: '1.2',
    title: 'Images : images porteuses d\'information',
    theme: 'Images',
    level: 'A',
    url: 'https://example.com/1.2',
  },
  {
    id: '2.1',
    title: 'Cadres : intitulé de cadre',
    theme: 'Cadres',
    level: 'A',
    url: 'https://example.com/2.1',
  },
];

const AUDIT: Audit = {
  id: 'a1',
  name: 'Test audit',
  mode: 'classic',
  themes: [],
  createdAt: '2026-08-15T10:00:00.000Z',
  updatedAt: '2026-08-15T10:00:00.000Z',
  progress: {
    '1.1': { status: 'conforme' },
  },
  notes: {},
  pages: {},
  checkedTests: {},
};

const FILTERS: CriteriaFilters = { search: '', level: '', status: '' };

function setup(overrides = {}) {
  const onThemeChange = vi.fn();
  const onFiltersChange = vi.fn();
  const onExpand = vi.fn();
  const onStatusChange = vi.fn();
  const onCheckedTestsChange = vi.fn();
  const onNoteChange = vi.fn();
  const onPagesChange = vi.fn();
  const onGlossaryClick = vi.fn();

  render(
    <AuditScreen
      audit={AUDIT}
      criteriaList={CRITERIA}
      themes={['Images', 'Cadres']}
      activeTheme="Images"
      onThemeChange={onThemeChange}
      filters={FILTERS}
      onFiltersChange={onFiltersChange}
      expandedCriteriaId={null}
      onExpand={onExpand}
      onStatusChange={onStatusChange}
      onCheckedTestsChange={onCheckedTestsChange}
      onNoteChange={onNoteChange}
      onPagesChange={onPagesChange}
      onGlossaryClick={onGlossaryClick}
      {...overrides}
    />,
  );

  return {
    onThemeChange,
    onFiltersChange,
    onExpand,
    onStatusChange,
    onCheckedTestsChange,
    onNoteChange,
    onPagesChange,
    onGlossaryClick,
  };
}

describe('AuditScreen', () => {
  it('affiche le titre du thème actif et son compte de critères', () => {
    setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Images' })).toBeInTheDocument();
    expect(screen.getByText('2 critères dans ce thème')).toBeInTheDocument();
  });

  it('compte les critères évalués et non évalués du thème', () => {
    setup();

    expect(screen.getByText('1 / 2 évalués')).toBeInTheDocument();
  });

  it('affiche une jauge segmentée avec un aria-label énonçant la répartition', () => {
    setup();

    const gauge = screen.getByRole('img', {
      name: '1 conformes, 0 non conformes, 0 non applicables, 1 à évaluer',
    });
    expect(gauge).toBeInTheDocument();
  });

  it('affiche la liste des critères du thème actif par défaut', () => {
    setup();

    expect(screen.getByText('Images : alternatives textuelles')).toBeInTheDocument();
    expect(screen.getByText('Images : images porteuses d\'information')).toBeInTheDocument();
    expect(screen.queryByText('Cadres : intitulé de cadre')).not.toBeInTheDocument();
  });

  it('bascule vers le détail étendu quand on clique sur un critère', async () => {
    const user = userEvent.setup();
    const { onExpand } = setup();

    // Le titre du critère est un heading dans CriteriaItem
    const criteriaHeading = screen.getByRole('heading', {
      name: /Images : alternatives textuelles/,
    });
    // Chercher le bouton de développement le plus proche (parent)
    const parentLi = criteriaHeading.closest('li');
    const expandButton = parentLi?.querySelector('button') as HTMLButtonElement;

    await user.click(expandButton);

    expect(onExpand).toHaveBeenCalledWith('1.1');
  });

  it('retourne à la liste quand on clique sur « Retour à la liste » en vue détail', async () => {
    const user = userEvent.setup();
    const { onExpand } = setup({
      expandedCriteriaId: '1.1',
    });

    const backButton = screen.getByRole('button', { name: 'Retour à la liste' });
    await user.click(backButton);

    expect(onExpand).toHaveBeenCalledWith(null);
  });

  it('affiche le bouton « Retour à la liste » en vue détail', () => {
    setup({ expandedCriteriaId: '1.1' });

    expect(screen.getByRole('button', { name: 'Retour à la liste' })).toBeInTheDocument();
  });

  it('montre l\'état vide avec un message citant le terme cherché', () => {
    setup({
      filters: { search: 'nonexistent', level: '', status: '' },
    });

    expect(screen.getByText('Aucun critère ne correspond')).toBeInTheDocument();
    expect(
      screen.getByText(
        '« nonexistent » n\'apparaît dans aucun intitulé de critère du thème Images. Essaie un autre thème, ou cherche ce terme dans le glossaire.'
      )
    ).toBeInTheDocument();
  });

  it('montre l\'état vide quand les filtres excluent tous les critères', () => {
    setup({
      filters: { search: '', level: 'AAA', status: '' },
    });

    expect(screen.getByText('Aucun critère ne correspond')).toBeInTheDocument();
    expect(
      screen.getByText('Les filtres actifs excluent les 2 critères de ce thème.')
    ).toBeInTheDocument();
  });

  it('affiche le bouton « Effacer les filtres » en état vide', () => {
    setup({
      filters: { search: 'test', level: '', status: '' },
    });

    expect(screen.getByRole('button', { name: 'Effacer les filtres' })).toBeInTheDocument();
  });

  it('réinitialise les filtres au clic sur « Effacer les filtres »', async () => {
    const user = userEvent.setup();
    const { onFiltersChange } = setup({
      filters: { search: 'test', level: '', status: '' },
    });

    const clearButton = screen.getByRole('button', { name: 'Effacer les filtres' });
    await user.click(clearButton);

    expect(onFiltersChange).toHaveBeenCalledWith({ search: '', level: '', status: '' });
  });

  it('affiche la case maîtresse pour sélectionner tous les critères affichés', () => {
    setup();
    expect(screen.getByRole('checkbox', { name: /Sélectionner les 2 critères affichés/ })).toBeInTheDocument();
  });

  it('sélectionne tous les critères au clic sur la case maîtresse', async () => {
    const user = userEvent.setup();
    setup();

    const masterCheckbox = screen.getByRole('checkbox', { name: /Sélectionner les 2 critères affichés/ });
    await user.click(masterCheckbox);

    expect(screen.getByText('2 critères sélectionnés')).toBeInTheDocument();
  });

  it('désélectionne tous les critères au deuxième clic sur la case maîtresse', async () => {
    const user = userEvent.setup();
    setup();

    const masterCheckbox = screen.getByRole('checkbox', { name: /Sélectionner les 2 critères affichés/ });
    await user.click(masterCheckbox);
    await user.click(masterCheckbox);

    expect(screen.queryByText(/critère sélectionné/)).not.toBeInTheDocument();
  });

  it('la case maîtresse est indéterminée en sélection partielle', async () => {
    const user = userEvent.setup();
    setup();

    const criteriaCheckbox = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ });
    await user.click(criteriaCheckbox);

    const masterCheckbox = screen.getByRole('checkbox', { name: /Sélectionner les 2 critères affichés/ });
    expect(masterCheckbox).toHaveProperty('indeterminate', true);
  });

  it('la case maîtresse n\'agit que sur les critères affichés avec un filtre actif', async () => {
    const user = userEvent.setup();
    setup({
      filters: { search: '', level: 'A', status: '' },
    });

    // Avec le filtre level=A, seuls les critères 1.1 et 1.2 (thème Images) sont affichés
    const masterCheckbox = screen.getByRole('checkbox', { name: /Sélectionner les 2 critères affichés/ });
    await user.click(masterCheckbox);

    expect(screen.getByText('2 critères sélectionnés')).toBeInTheDocument();
  });

  it('affiche la barre d\'actions groupées quand on sélectionne un critère', async () => {
    const user = userEvent.setup();
    setup();

    const checkbox = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ });
    await user.click(checkbox);

    expect(screen.getByText('1 critère sélectionné')).toBeInTheDocument();
  });

  it('met à jour le cardinal de la barre d\'actions quand on sélectionne plusieurs critères', async () => {
    const user = userEvent.setup();
    setup();

    const checkbox1 = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ });
    const checkbox2 = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.2/ });
    await user.click(checkbox1);
    await user.click(checkbox2);

    expect(screen.getByText('2 critères sélectionnés')).toBeInTheDocument();
  });

  it('appelle onStatusChange pour chaque critère sélectionné au clic sur un bouton de statut', async () => {
    const user = userEvent.setup();
    const { onStatusChange } = setup();

    const checkbox1 = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ });
    const checkbox2 = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.2/ });
    await user.click(checkbox1);
    await user.click(checkbox2);

    const conformeButton = screen.getByRole('button', { name: /Conforme/ });
    await user.click(conformeButton);

    expect(onStatusChange).toHaveBeenCalledWith('1.1', 'conforme');
    expect(onStatusChange).toHaveBeenCalledWith('1.2', 'conforme');
    expect(onStatusChange).toHaveBeenCalledTimes(2);
  });

  it('désélectionne tous les critères après avoir appliqué un statut de groupe', async () => {
    const user = userEvent.setup();
    setup();

    const checkbox = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ });
    await user.click(checkbox);

    const conformeButton = screen.getByRole('button', { name: /Conforme/ });
    await user.click(conformeButton);

    expect(screen.queryByText(/critère sélectionné/)).not.toBeInTheDocument();
  });

  it('masque la barre d\'actions groupées en vue détail', () => {
    setup({ expandedCriteriaId: '1.1' });

    expect(screen.queryByText(/critère sélectionné/)).not.toBeInTheDocument();
  });

  it('affiche le bouton « Tout désélectionner » dans la barre d\'actions', async () => {
    const user = userEvent.setup();
    setup();

    const checkbox = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ });
    await user.click(checkbox);

    expect(screen.getByRole('button', { name: 'Tout désélectionner' })).toBeInTheDocument();
  });

  it('désélectionne tous les critères au clic sur « Tout désélectionner »', async () => {
    const user = userEvent.setup();
    setup();

    const checkbox1 = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ });
    const checkbox2 = screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.2/ });
    await user.click(checkbox1);
    await user.click(checkbox2);

    const deselectButton = screen.getByRole('button', { name: 'Tout désélectionner' });
    await user.click(deselectButton);

    expect(screen.queryByText(/critère sélectionné/)).not.toBeInTheDocument();
  });
});
