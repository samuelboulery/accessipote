import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusPill from './StatusPill';

describe('StatusPill', () => {
  it('porte toujours un libellé, jamais la couleur seule', () => {
    const { container, rerender } = render(<StatusPill status="conforme" mode="classic" />);
    expect(screen.getByText('Conforme')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();

    rerender(<StatusPill status="non-conforme" mode="classic" />);
    expect(screen.getByText('Non conforme')).toBeInTheDocument();

    rerender(<StatusPill status="non-applicable" mode="classic" />);
    expect(screen.getByText('Non applicable')).toBeInTheDocument();
  });

  it('rend « À évaluer » quand aucun statut n\'est posé', () => {
    render(<StatusPill status={undefined} mode="classic" />);
    expect(screen.getByText('À évaluer')).toBeInTheDocument();
  });

  it('change les libellés en mode design system sans changer l\'axe sémantique', () => {
    const { rerender } = render(<StatusPill status="default-compliant" mode="design-system" />);
    expect(screen.getByText('Conforme par défaut')).toBeInTheDocument();

    rerender(<StatusPill status="project-implementation" mode="design-system" />);
    expect(screen.getByText('À mettre en place')).toBeInTheDocument();
  });

  it('donne à chaque statut une icône distincte', () => {
    const { container: conforme } = render(<StatusPill status="conforme" mode="classic" />);
    const { container: ecart } = render(<StatusPill status="non-conforme" mode="classic" />);

    expect(conforme.querySelector('svg')?.innerHTML).not.toBe(ecart.querySelector('svg')?.innerHTML);
  });
});
