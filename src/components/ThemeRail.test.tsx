import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeRail, { type ThemeProgress } from './ThemeRail';

const THEMES: ThemeProgress[] = [
  { theme: 'Images', evaluated: 5, total: 8 },
  { theme: 'Couleurs', evaluated: 3, total: 6 },
  { theme: 'Formulaires', evaluated: 7, total: 7 },
  { theme: 'Liens', evaluated: 0, total: 4 },
];

function setup(overrides = {}) {
  const onThemeChange = vi.fn();
  render(
    <ThemeRail
      themes={THEMES}
      activeTheme="Images"
      onThemeChange={onThemeChange}
      {...overrides}
    />,
  );
  return { onThemeChange };
}

describe('ThemeRail', () => {
  it('crée un tablist avec un rôle et un label', () => {
    setup();
    const tablist = screen.getByRole('tablist', { name: 'Thèmes de l\'audit' });
    expect(tablist).toBeInTheDocument();
  });

  it('affiche une pastille par thème avec le ratio évalués/total', () => {
    setup();
    expect(screen.getByText('5/8')).toBeInTheDocument();
    expect(screen.getByText('3/6')).toBeInTheDocument();
    expect(screen.getByText('7/7')).toBeInTheDocument();
    expect(screen.getByText('0/4')).toBeInTheDocument();
  });

  it('marque le thème actif avec aria-selected', () => {
    setup();
    const imagesTab = screen.getByRole('tab', { name: /Images/ });
    const couleursTab = screen.getByRole('tab', { name: /Couleurs/ });

    expect(imagesTab).toHaveAttribute('aria-selected', 'true');
    expect(couleursTab).toHaveAttribute('aria-selected', 'false');
  });

  it('implémente le tabindex roving: 0 sur l\'actif, -1 sinon', () => {
    setup();
    const imagesTab = screen.getByRole('tab', { name: /Images/ });
    const couleursTab = screen.getByRole('tab', { name: /Couleurs/ });

    expect(imagesTab).toHaveAttribute('tabindex', '0');
    expect(couleursTab).toHaveAttribute('tabindex', '-1');
  });

  it('remonte le thème cliqué via onThemeChange', async () => {
    const user = userEvent.setup();
    const { onThemeChange } = setup();

    await user.click(screen.getByRole('tab', { name: /Couleurs/ }));

    expect(onThemeChange).toHaveBeenCalledWith('Couleurs');
  });

  it('navigue vers la droite à la flèche droite', async () => {
    const user = userEvent.setup();
    const { onThemeChange } = setup({ activeTheme: 'Images' });

    const imagesTab = screen.getByRole('tab', { name: /Images/ });
    await user.click(imagesTab);
    await user.keyboard('{ArrowRight}');

    expect(onThemeChange).toHaveBeenCalledWith('Couleurs');
  });

  it('navigue vers la gauche à la flèche gauche', async () => {
    const user = userEvent.setup();
    const { onThemeChange } = setup({ activeTheme: 'Couleurs' });

    const couleursTab = screen.getByRole('tab', { name: /Couleurs/ });
    await user.click(couleursTab);
    await user.keyboard('{ArrowLeft}');

    expect(onThemeChange).toHaveBeenCalledWith('Images');
  });

  it('boucle en début de liste au défilement vers la gauche depuis le premier thème', async () => {
    const user = userEvent.setup();
    const { onThemeChange } = setup({ activeTheme: 'Images' });

    const imagesTab = screen.getByRole('tab', { name: /Images/ });
    await user.click(imagesTab);
    await user.keyboard('{ArrowLeft}');

    expect(onThemeChange).toHaveBeenCalledWith('Liens');
  });

  it('boucle en fin de liste au défilement vers la droite depuis le dernier thème', async () => {
    const user = userEvent.setup();
    const { onThemeChange } = setup({ activeTheme: 'Liens' });

    const liensTab = screen.getByRole('tab', { name: /Liens/ });
    await user.click(liensTab);
    await user.keyboard('{ArrowRight}');

    expect(onThemeChange).toHaveBeenCalledWith('Images');
  });

  it('affiche une coche quand un thème est complet (évalués === total)', () => {
    setup();
    const checkMarks = screen.getAllByLabelText('thème complet');
    expect(checkMarks).toHaveLength(1);
    expect(checkMarks[0]).toBeInTheDocument();
  });

  it('n\'affiche pas de coche pour les thèmes incomplets', () => {
    setup();
    const imagesTab = screen.getByRole('tab', { name: /Images/ });
    const couleursTab = screen.getByRole('tab', { name: /Couleurs/ });
    const liensTab = screen.getByRole('tab', { name: /Liens/ });

    expect(imagesTab.querySelector('[aria-label="thème complet"]')).not.toBeInTheDocument();
    expect(couleursTab.querySelector('[aria-label="thème complet"]')).not.toBeInTheDocument();
    expect(liensTab.querySelector('[aria-label="thème complet"]')).not.toBeInTheDocument();
  });

  it('déplace le focus au thème sélectionné par clavier', async () => {
    const user = userEvent.setup();
    setup();

    const imagesTab = screen.getByRole('tab', { name: /Images/ });
    await user.click(imagesTab);
    await user.keyboard('{ArrowRight}');

    const couleursTab = screen.getByRole('tab', { name: /Couleurs/ });
    expect(couleursTab).toHaveFocus();
  });
});
