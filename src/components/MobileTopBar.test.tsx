import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileTopBar from './MobileTopBar';

function setup() {
  const onCycleTheme = vi.fn();
  const { container } = render(<MobileTopBar themeMode="light" onCycleTheme={onCycleTheme} />);
  return { onCycleTheme, container };
}

describe('MobileTopBar', () => {
  // La sidebar emporte le nom de l'app en dessous de 640px : sans cette barre,
  // rien n'identifie plus l'écran.
  it('nomme l\'application', () => {
    setup();

    expect(screen.getByText('Accessipote')).toBeInTheDocument();
  });

  it('porte la bascule de thème et remonte le clic', async () => {
    const user = userEvent.setup();
    const { onCycleTheme } = setup();

    await user.click(screen.getByRole('button', { name: /Thème :/ }));

    expect(onCycleTheme).toHaveBeenCalledOnce();
  });

  it('garde le logo hors de l\'arbre accessible', () => {
    const { container } = setup();

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('n\'expose aucune destination — la navigation reste aux onglets', () => {
    setup();

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
