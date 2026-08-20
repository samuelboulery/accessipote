import { render, screen } from '@testing-library/react';
import HomeHero from './HomeHero';

function setup(overrides = {}) {
  render(<HomeHero criteriaCount={106} themeCount={13} glossaryCount={119} {...overrides} />);
}

describe('HomeHero', () => {
  it('affiche le sur-titre du référentiel', () => {
    setup();
    expect(screen.getByText('RGAA 4.1.2')).toBeInTheDocument();
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

  it('se présente en bannière, au rayon des panneaux', () => {
    const { container } = render(
      <HomeHero criteriaCount={106} themeCount={13} glossaryCount={119} />,
    );

    // Ici les classes SONT le traitement demandé : dégradé, grain, rayon.
    // Le rayon et la marge sont conditionnels : en mobile il n'y a pas de
    // panneau à suivre, la bannière va d'un bord à l'autre.
    const banniere = container.querySelector('header');
    expect(banniere).toHaveClass('banner');
    expect(banniere).toHaveClass('sm:rounded-l-card');
    expect(banniere).not.toHaveClass('rounded-l-card');
  });

  // La bannière décide de sa mise en page d'après sa propre largeur : à droite
  // d'une sidebar de 244px en desktop, plein écran en mobile — un breakpoint
  // viewport confond les deux.
  it('délègue sa mise en page à une container query', () => {
    const { container } = render(
      <HomeHero criteriaCount={106} themeCount={13} glossaryCount={119} />,
    );

    expect(container.querySelector('header')).toHaveClass('hero');
    expect(container.querySelector('.hero-layout')).toBeInTheDocument();
    expect(container.querySelector('.hero-figures')).toBeInTheDocument();
  });
});
