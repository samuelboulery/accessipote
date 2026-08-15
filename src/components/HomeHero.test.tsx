import { render, screen } from '@testing-library/react';
import HomeHero from './HomeHero';

function setup(overrides = {}) {
  render(<HomeHero criteriaCount={106} themeCount={13} glossaryCount={119} {...overrides} />);
}

describe('HomeHero', () => {
  it('affiche le sur-titre du référentiel', () => {
    setup();
    expect(screen.getByText('RGAA 4.1')).toBeInTheDocument();
  });

  it('affiche le titre principal', () => {
    setup();
    expect(
      screen.getByRole('heading', { name: 'Ton pote qui connaît le RGAA par cœur.', level: 1 }),
    ).toBeInTheDocument();
  });

  it('ne répète ni le logo ni le mot-symbole, que la barre latérale porte', () => {
    setup();
    expect(screen.queryByText('Accessipote')).not.toBeInTheDocument();
  });

  it('accroche avec le nombre réel de critères', () => {
    setup();
    expect(screen.getByText(/Les 106 critères/)).toBeInTheDocument();
  });

  it('donne le poids du référentiel en chiffres', () => {
    setup();

    expect(screen.getByText('106')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('119')).toBeInTheDocument();
    expect(screen.getByText('critères')).toBeInTheDocument();
    expect(screen.getByText('thèmes')).toBeInTheDocument();
    expect(screen.getByText('définitions')).toBeInTheDocument();
  });

  it('dérive les chiffres des données plutôt que de les écrire en dur', () => {
    setup({ criteriaCount: 42, themeCount: 7, glossaryCount: 3 });

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('accorde les libellés au singulier', () => {
    setup({ criteriaCount: 1, themeCount: 1, glossaryCount: 1 });

    expect(screen.getByText('critère')).toBeInTheDocument();
    expect(screen.getByText('thème')).toBeInTheDocument();
    expect(screen.getByText('définition')).toBeInTheDocument();
  });
});
