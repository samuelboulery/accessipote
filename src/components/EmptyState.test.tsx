import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('affiche le titre et le corps', () => {
    render(<EmptyState title="Aucun critère" body="Essaie un autre thème." />);

    expect(screen.getByRole('heading', { name: 'Aucun critère' })).toBeInTheDocument();
    expect(screen.getByText('Essaie un autre thème.')).toBeInTheDocument();
  });

  it('rend les actions fournies', () => {
    render(
      <EmptyState
        title="Aucun critère"
        body="Essaie un autre thème."
        actions={<button type="button">Effacer les filtres</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Effacer les filtres' })).toBeInTheDocument();
  });

  it('masque l\'icône aux technologies d\'assistance', () => {
    const { container } = render(<EmptyState title="Vide" body="Rien." />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
