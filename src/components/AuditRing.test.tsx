import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditRing from './AuditRing';

describe('AuditRing', () => {
  it('énonce sa valeur en clair pour les lecteurs d\'écran', () => {
    render(
      <AuditRing size={56} segments={[{ key: 'a', share: 0.45, color: '#000' }]} label="45 % des critères évalués" />,
    );

    expect(screen.getByRole('img', { name: '45 % des critères évalués' })).toBeInTheDocument();
  });

  it('calcule le stroke-dasharray à partir du rayon plutôt que de valeurs en dur', () => {
    const { container } = render(
      <AuditRing size={48} segments={[{ key: 'a', share: 0.5, color: '#000' }]} label="moitié" />,
    );

    const circles = container.querySelectorAll('circle');
    // Piste + un segment.
    expect(circles).toHaveLength(2);

    const circumference = 2 * Math.PI * 21;
    const [on] = circles[1].getAttribute('stroke-dasharray')!.split(' ').map(Number);
    expect(on).toBeCloseTo(circumference / 2, 0);
  });

  it('applique l\'épaisseur correspondant à la taille', () => {
    const { container } = render(
      <AuditRing size={128} segments={[{ key: 'a', share: 1, color: '#000' }]} label="tout" />,
    );

    expect(container.querySelector('circle')).toHaveAttribute('stroke-width', '16');
  });

  it('retranche l\'écart demandé entre segments', () => {
    const { container } = render(
      <AuditRing
        size={128}
        gap={4}
        segments={[
          { key: 'a', share: 0.5, color: '#000' },
          { key: 'b', share: 0.5, color: '#888' },
        ]}
        label="deux moitiés"
      />,
    );

    const circumference = 2 * Math.PI * 56;
    const segments = Array.from(container.querySelectorAll('circle')).slice(1);
    expect(segments).toHaveLength(2);
    const [on] = segments[0].getAttribute('stroke-dasharray')!.split(' ').map(Number);
    expect(on).toBeCloseTo(circumference / 2 - 4, 0);
  });

  it('n\'émet aucun segment pour une part nulle', () => {
    const { container } = render(
      <AuditRing
        size={48}
        segments={[
          { key: 'a', share: 0, color: '#000' },
          { key: 'b', share: 1, color: '#888' },
        ]}
        label="rien puis tout"
      />,
    );

    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('masque le contenu central aux lecteurs d\'écran, la valeur étant déjà dans le label', () => {
    const { container } = render(
      <AuditRing size={56} segments={[{ key: 'a', share: 0.45, color: '#000' }]} label="45 %">
        <span>45%</span>
      </AuditRing>,
    );

    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('45%');
  });
});
