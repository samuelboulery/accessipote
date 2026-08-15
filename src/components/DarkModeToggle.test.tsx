import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DarkModeToggle from './DarkModeToggle';

describe('DarkModeToggle', () => {
  it('annonce l\'état courant et la destination du clic', () => {
    render(<DarkModeToggle mode="light" onCycle={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Thème : clair. Passer au thème sombre' }),
    ).toBeInTheDocument();
  });

  it('cycle clair, sombre, système puis revient au clair', () => {
    const { rerender } = render(<DarkModeToggle mode="light" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Passer au thème sombre/ })).toBeInTheDocument();

    rerender(<DarkModeToggle mode="dark" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Passer au thème système/ })).toBeInTheDocument();

    // Sans cette troisième position, on ne peut plus rendre la main au navigateur.
    rerender(<DarkModeToggle mode="system" onCycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Passer au thème clair/ })).toBeInTheDocument();
  });

  it('donne une icône distincte à chaque état', () => {
    const { container: clair } = render(<DarkModeToggle mode="light" onCycle={vi.fn()} />);
    const { container: sombre } = render(<DarkModeToggle mode="dark" onCycle={vi.fn()} />);
    const { container: systeme } = render(<DarkModeToggle mode="system" onCycle={vi.fn()} />);

    const svg = (c: HTMLElement) => c.querySelector('svg')?.innerHTML;
    expect(svg(clair)).not.toBe(svg(sombre));
    expect(svg(sombre)).not.toBe(svg(systeme));
    expect(svg(clair)).not.toBe(svg(systeme));
  });

  it('remonte le clic', async () => {
    const user = userEvent.setup();
    const onCycle = vi.fn();
    render(<DarkModeToggle mode="system" onCycle={onCycle} />);

    await user.click(screen.getByRole('button'));

    expect(onCycle).toHaveBeenCalledTimes(1);
  });

  it('porte une cible d\'au moins 44px', () => {
    render(<DarkModeToggle mode="light" onCycle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-ctrl');
    expect(button).toHaveClass('w-ctrl');
    expect(button).toHaveClass('target-44');
  });
});
