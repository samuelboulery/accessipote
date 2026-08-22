import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AutoBadge from './AutoBadge';
import type { AutoVerdict } from '../types';

const auto: AutoVerdict = {
  status: 'non-conforme',
  testIds: ['1.1.1', '1.1.2'],
  scannedAt: '2026-08-20T09:30:00.000Z',
  evidence: [
    { url: 'https://exemple.fr/contact', selector: 'main > img:nth-child(2)' },
    { url: 'https://exemple.fr/', selector: 'header img' },
  ],
};

describe('AutoBadge', () => {
  it("ne rend rien quand le critère n'a pas de provenance", () => {
    const { container } = render(<AutoBadge auto={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('annonce le scan par un libellé, jamais par la seule couleur', () => {
    render(<AutoBadge auto={auto} />);
    expect(screen.getByText(/pré-rempli par le scan/i)).toBeInTheDocument();
  });

  it('affiche la date du scan', () => {
    render(<AutoBadge auto={auto} />);
    expect(screen.getByText(/20\/08\/2026/)).toBeInTheDocument();
  });

  it('expose les tests RGAA qui ont tranché', () => {
    render(<AutoBadge auto={auto} />);
    expect(screen.getByText(/1\.1\.1, 1\.1\.2/)).toBeInTheDocument();
  });

  it('expose la page et le sélecteur de chaque preuve', () => {
    render(<AutoBadge auto={auto} />);
    expect(screen.getByText('https://exemple.fr/contact')).toBeInTheDocument();
    expect(screen.getByText('main > img:nth-child(2)')).toBeInTheDocument();
    expect(screen.getByText('header img')).toBeInTheDocument();
  });

  it('tient les preuves dans un dépliant fermé par défaut', () => {
    render(<AutoBadge auto={auto} />);
    expect(screen.getByRole('group')).not.toHaveAttribute('open');
  });
});

describe('AutoBadge — statut posé sur un indice', () => {
  const surIndice: AutoVerdict = { ...auto, fromHint: true };

  it('dit que le statut repose sur un indice, pas sur une preuve', () => {
    render(<AutoBadge auto={surIndice} />);
    expect(screen.getByText(/indice/i)).toBeInTheDocument();
  });

  it('ne prétend pas au pré-remplissage prouvé', () => {
    render(<AutoBadge auto={surIndice} />);
    expect(screen.queryByText(/^Pré-rempli par le scan du/)).not.toBeInTheDocument();
  });

  it('garde la date et les preuves consultables', () => {
    render(<AutoBadge auto={surIndice} />);
    expect(screen.getByText(/20\/08\/2026/)).toBeInTheDocument();
    expect(screen.getByText('header img')).toBeInTheDocument();
  });
});
