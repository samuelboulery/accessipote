import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  describe('rendu basique', () => {
    it('affiche le composant avec le taux de conformité à 0%', () => {
      render(<ProgressBar progress={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('affiche le composant avec le taux de conformité à 50%', () => {
      render(<ProgressBar progress={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('affiche le composant avec le taux de conformité à 100%', () => {
      render(<ProgressBar progress={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('arrondit le pourcentage affiché', () => {
      render(<ProgressBar progress={33.33} />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('arrondit le pourcentage à 85.67 en 86%', () => {
      render(<ProgressBar progress={85.67} />);
      expect(screen.getByText('86%')).toBeInTheDocument();
    });

    it('affiche le label "Progression"', () => {
      render(<ProgressBar progress={50} />);
      expect(screen.getByText('Progression')).toBeInTheDocument();
    });
  });

  describe('attributs ARIA', () => {
    it('a le rôle progressbar', () => {
      render(<ProgressBar progress={50} />);
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toBeInTheDocument();
    });

    it('a aria-valuenow égal au pourcentage arrondi', () => {
      render(<ProgressBar progress={50} />);
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuenow', '50');
    });

    it('a aria-valuemin égal à 0', () => {
      render(<ProgressBar progress={50} />);
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuemin', '0');
    });

    it('a aria-valuemax égal à 100', () => {
      render(<ProgressBar progress={50} />);
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuemax', '100');
    });

    it('met à jour aria-valuenow avec une nouvelle valeur', () => {
      const { rerender } = render(<ProgressBar progress={25} />);
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuenow', '25');

      rerender(<ProgressBar progress={75} />);
      expect(progressElement).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('styles CSS', () => {
    it('applique la classe de couleur "bg-red-500" quand le taux est inférieur à 50%', () => {
      render(<ProgressBar progress={25} />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('applique la classe de couleur "bg-yellow-500" quand le taux est entre 50% et 80%', () => {
      render(<ProgressBar progress={65} />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-yellow-500');
    });

    it('applique la classe de couleur "bg-green-500" quand le taux est supérieur à 80%', () => {
      render(<ProgressBar progress={85} />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('applique la largeur correcte pour le taux de 50%', () => {
      render(<ProgressBar progress={50} />);
      const innerBar = screen.getByRole('progressbar').querySelector('div > div');
      expect(innerBar).toHaveStyle({ width: '50%' });
    });

    it('applique la largeur correcte pour le taux de 0%', () => {
      render(<ProgressBar progress={0} />);
      const innerBar = screen.getByRole('progressbar').querySelector('div > div');
      expect(innerBar).toHaveStyle({ width: '0%' });
    });

    it('applique la largeur correcte pour le taux de 100%', () => {
      render(<ProgressBar progress={100} />);
      const innerBar = screen.getByRole('progressbar').querySelector('div > div');
      expect(innerBar).toHaveStyle({ width: '100%' });
    });

    it('conserve les classes de style de base (h-full, rounded-full)', () => {
      render(<ProgressBar progress={50} />);
      const innerBar = screen.getByRole('progressbar').querySelector('div > div');
      expect(innerBar).toHaveClass('h-full', 'rounded-full', 'transition-all', 'duration-300');
    });
  });

  describe('cas limites', () => {
    it('gère la valeur zéro correctement', () => {
      render(<ProgressBar progress={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuenow', '0');
    });

    it('gère la valeur 100 correctement', () => {
      render(<ProgressBar progress={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuenow', '100');
    });

    it('gère les valeurs décimales', () => {
      render(<ProgressBar progress={33.49} />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('gère la valeur 50 exactement (seuil jaune)', () => {
      render(<ProgressBar progress={50} />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-yellow-500');
    });

    it('gère la valeur 80 exactement (seuil vert)', () => {
      render(<ProgressBar progress={80} />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-green-500');
    });
  });

  describe('accessibilité', () => {
    it('a un label visible pour le pourcentage', () => {
      render(<ProgressBar progress={75} />);
      expect(screen.getByText('75%')).toBeVisible();
    });

    it('a un label visible "Progression"', () => {
      render(<ProgressBar progress={50} />);
      expect(screen.getByText('Progression')).toBeVisible();
    });

    it('a une structure sémantique correcte avec role="progressbar"', () => {
      render(<ProgressBar progress={50} />);
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toBeInTheDocument();
      expect(progressElement.parentElement).toBeTruthy();
    });
  });

  describe('comportement avec re-rendu', () => {
    it('met à jour le pourcentage affiché lors d\'un re-rendu', () => {
      const { rerender } = render(<ProgressBar progress={25} />);
      expect(screen.getByText('25%')).toBeInTheDocument();

      rerender(<ProgressBar progress={75} />);
      expect(screen.queryByText('25%')).not.toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('met à jour la couleur de la barre lors d\'un re-rendu', () => {
      const { rerender } = render(<ProgressBar progress={25} />);
      const progressBar = screen.getByRole('progressbar').querySelector('div');
      expect(progressBar).toHaveClass('bg-red-500');

      rerender(<ProgressBar progress={85} />);
      expect(progressBar).toHaveClass('bg-green-500');
    });
  });
});
