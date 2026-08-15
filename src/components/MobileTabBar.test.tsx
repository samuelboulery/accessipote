import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileTabBar from './MobileTabBar';

describe('MobileTabBar', () => {
  it('nomme chaque destination par son contenu', () => {
    render(<MobileTabBar view="audit" onNavigate={vi.fn()} />);

    for (const label of ['Accueil', 'Audit', 'Synthèse', 'Glossaire']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('marque la destination courante avec aria-current', () => {
    render(<MobileTabBar view="glossary" onNavigate={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Glossaire' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Audit' })).not.toHaveAttribute('aria-current');
  });

  it('remonte la navigation demandée', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<MobileTabBar view="home" onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: 'Synthèse' }));

    expect(onNavigate).toHaveBeenCalledWith('summary');
  });

  it('donne aux onglets une cible tactile de 48px', () => {
    render(<MobileTabBar view="home" onNavigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveClass('h-prim');
  });
});
