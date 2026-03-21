import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModeSelector from './ModeSelector';

describe('ModeSelector', () => {
  it('affiche le mode classique comme actif quand mode="classic"', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    const classicLabel = screen.getByText('Classique');
    const designSystemLabel = screen.getByText('Design System');

    // Texte du mode classique doit être en gris foncé (actif)
    expect(classicLabel).toHaveClass('text-gray-900');
    // Texte du mode design-system doit être en gris clair (inactif)
    expect(designSystemLabel).toHaveClass('text-gray-500');
  });

  it('affiche le mode design-system comme actif quand mode="design-system"', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="design-system" onModeChange={handleModeChange} />);

    const classicLabel = screen.getByText('Classique');
    const designSystemLabel = screen.getByText('Design System');

    // Texte du mode design-system doit être en gris foncé (actif)
    expect(designSystemLabel).toHaveClass('text-gray-900');
    // Texte du mode classique doit être en gris clair (inactif)
    expect(classicLabel).toHaveClass('text-gray-500');
  });

  it('affiche la description correcte pour le mode classique', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    expect(screen.getByText('Conforme / Non conforme / Non applicable')).toBeInTheDocument();
  });

  it('affiche la description correcte pour le mode design-system', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="design-system" onModeChange={handleModeChange} />);

    expect(screen.getByText('Conforme par défaut / À mettre en place / Non applicable')).toBeInTheDocument();
  });

  it('appelle onModeChange avec "design-system" quand on clique depuis le mode classique', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    const switchButton = screen.getByRole('switch');
    fireEvent.click(switchButton);

    expect(handleModeChange).toHaveBeenCalledWith('design-system');
    expect(handleModeChange).toHaveBeenCalledTimes(1);
  });

  it('appelle onModeChange avec "classic" quand on clique depuis le mode design-system', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="design-system" onModeChange={handleModeChange} />);

    const switchButton = screen.getByRole('switch');
    fireEvent.click(switchButton);

    expect(handleModeChange).toHaveBeenCalledWith('classic');
    expect(handleModeChange).toHaveBeenCalledTimes(1);
  });

  it('affiche aria-checked="true" quand mode="design-system"', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="design-system" onModeChange={handleModeChange} />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveAttribute('aria-checked', 'true');
  });

  it('affiche aria-checked="false" quand mode="classic"', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveAttribute('aria-checked', 'false');
  });

  it('affiche le bouton toggle avec fond noir quand mode="design-system"', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="design-system" onModeChange={handleModeChange} />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveClass('bg-black');
  });

  it('affiche le bouton toggle avec fond gris quand mode="classic"', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveClass('bg-gray-300');
  });

  it('affiche le titre "Mode de vérification"', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    expect(screen.getByText('Mode de vérification')).toBeInTheDocument();
  });

  it('utilise role="switch" pour l\'accessibilité', () => {
    const handleModeChange = vi.fn();
    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toBeInTheDocument();
  });

  it('n\'affiche pas de console.log', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const handleModeChange = vi.fn();

    render(<ModeSelector mode="classic" onModeChange={handleModeChange} />);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('supporte plusieurs clics successifs', () => {
    const handleModeChange = vi.fn();
    const { rerender } = render(
      <ModeSelector mode="classic" onModeChange={handleModeChange} />
    );

    const switchButton = screen.getByRole('switch');

    // Premier clic : classic -> design-system
    fireEvent.click(switchButton);
    expect(handleModeChange).toHaveBeenNthCalledWith(1, 'design-system');

    // Simuler le changement de prop
    rerender(<ModeSelector mode="design-system" onModeChange={handleModeChange} />);

    // Deuxième clic : design-system -> classic
    fireEvent.click(switchButton);
    expect(handleModeChange).toHaveBeenNthCalledWith(2, 'classic');
    expect(handleModeChange).toHaveBeenCalledTimes(2);
  });
});
