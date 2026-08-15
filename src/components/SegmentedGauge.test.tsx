import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SegmentedGauge from './SegmentedGauge';

const SEGMENTS = [
  { key: 'ok', count: 5, color: '#0F5C37' },
  { key: 'ko', count: 3, color: '#8F1D16' },
  { key: 'na', count: 2, color: '#9A9A9A' },
];

describe('SegmentedGauge', () => {
  it('énonce la répartition complète en toutes lettres', () => {
    render(
      <SegmentedGauge
        segments={SEGMENTS}
        total={10}
        label="5 conformes, 3 non conformes, 2 non applicables"
      />,
    );

    expect(
      screen.getByRole('img', { name: '5 conformes, 3 non conformes, 2 non applicables' }),
    ).toBeInTheDocument();
  });

  it('sépare les segments par un filet, sans quoi deux teintes adjacentes se confondent', () => {
    render(<SegmentedGauge segments={SEGMENTS} total={10} label="répartition" />);

    expect(screen.getByRole('img')).toHaveClass('gap-[2px]');
  });

  it('donne à chaque segment une largeur proportionnelle', () => {
    const { container } = render(
      <SegmentedGauge segments={SEGMENTS} total={10} label="répartition" />,
    );

    const bars = container.querySelectorAll('span > span');
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveStyle({ width: '50%' });
    expect(bars[1]).toHaveStyle({ width: '30%' });
    expect(bars[2]).toHaveStyle({ width: '20%' });
  });

  it('n\'émet pas de segment vide', () => {
    const { container } = render(
      <SegmentedGauge
        segments={[{ key: 'ok', count: 0, color: '#000' }, { key: 'ko', count: 4, color: '#888' }]}
        total={4}
        label="répartition"
      />,
    );

    expect(container.querySelectorAll('span > span')).toHaveLength(1);
  });

  it('ne divise pas par zéro quand il n\'y a aucun critère', () => {
    const { container } = render(
      <SegmentedGauge segments={SEGMENTS} total={0} label="aucun critère" />,
    );

    expect(container.querySelectorAll('span > span')).toHaveLength(0);
  });
});
