import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CriteriaItem from './CriteriaItem';
import type { CriteriaRGAA } from '../types';

const baseCriterion: CriteriaRGAA = {
  id: '1.1',
  title: 'Titre du critère 1.1',
  url: 'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.1',
  theme: 'Images',
  level: 'A',
};

const criterionWithTests: CriteriaRGAA = {
  ...baseCriterion,
  tests: [
    { id: '1.1.1', questions: ['Est-ce que l\'image a un attribut `alt` ?', 'Le texte est-il pertinent ?'] },
  ],
};

const criterionWithReferences: CriteriaRGAA = {
  ...baseCriterion,
  references: {
    wcag: ['1.1.1'],
    techniques: ['G94', 'H37'],
  },
};

const criterionWithDescription: CriteriaRGAA = {
  ...baseCriterion,
  description: 'Description du critère avec du `code` inline.',
};

const defaultProps = {
  criterion: baseCriterion,
  mode: 'classic' as const,
  onStatusChange: vi.fn(),
  onGlossaryClick: vi.fn(),
};

describe('CriteriaItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher l\'id et le thème du critère', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.getByText('1.1')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
  });

  it('devrait afficher le titre du critère', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.getByText('Titre du critère 1.1')).toBeInTheDocument();
  });

  it('devrait afficher le lien vers le site officiel', () => {
    render(<CriteriaItem {...defaultProps} />);
    const link = screen.getByText('Voir le critère sur le site officiel');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
    expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('devrait afficher les boutons radio en mode classic', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.getByLabelText('Conforme')).toBeInTheDocument();
    expect(screen.getByLabelText('Non conforme')).toBeInTheDocument();
    expect(screen.getByLabelText('Non applicable')).toBeInTheDocument();
  });

  it('devrait afficher les boutons radio en mode design-system', () => {
    render(<CriteriaItem {...defaultProps} mode="design-system" />);
    expect(screen.getByLabelText('Conforme par défaut')).toBeInTheDocument();
    expect(screen.getByLabelText('À mettre en place')).toBeInTheDocument();
    expect(screen.getByLabelText('Non applicable')).toBeInTheDocument();
  });

  it('devrait appeler onStatusChange lors du clic sur un radio', () => {
    const onStatusChange = vi.fn();
    render(<CriteriaItem {...defaultProps} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByLabelText('Non conforme'));
    expect(onStatusChange).toHaveBeenCalledWith('1.1', 'non-conforme');
  });

  it('devrait appeler onStatusChange en mode design-system', () => {
    const onStatusChange = vi.fn();
    render(<CriteriaItem {...defaultProps} mode="design-system" onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByLabelText('À mettre en place'));
    expect(onStatusChange).toHaveBeenCalledWith('1.1', 'project-implementation');
  });

  it('devrait afficher le badge de statut quand currentStatus est conforme', () => {
    const { container } = render(<CriteriaItem {...defaultProps} currentStatus="conforme" />);
    // Le badge conforme a bg-green-100
    const badge = container.querySelector('span.bg-green-100');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('Conforme');
  });

  it('devrait afficher le badge "Non conforme" pour le statut non-conforme', () => {
    const { container } = render(<CriteriaItem {...defaultProps} currentStatus="non-conforme" />);
    const badge = container.querySelector('span.bg-red-100');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('Non conforme');
  });

  it('devrait afficher le badge "Non applicable" pour le statut non-applicable', () => {
    const { container } = render(<CriteriaItem {...defaultProps} currentStatus="non-applicable" />);
    // Non-applicable badge : bg-gray-100 et text-xs font-medium (différent de l'id badge font-semibold text-sm)
    const badge = container.querySelector('span.bg-gray-100.font-medium');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('Non applicable');
  });

  it('devrait afficher le badge "Conforme par défaut" pour le statut default-compliant', () => {
    const { container } = render(<CriteriaItem {...defaultProps} currentStatus="default-compliant" />);
    const badge = container.querySelector('span.bg-green-100');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('Conforme par défaut');
  });

  it('devrait afficher le badge "À mettre en place" pour le statut project-implementation', () => {
    const { container } = render(<CriteriaItem {...defaultProps} currentStatus="project-implementation" />);
    const badge = container.querySelector('span.bg-amber-100');
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toBe('À mettre en place');
  });

  it('ne devrait pas afficher de badge coloré si currentStatus est undefined', () => {
    const { container } = render(<CriteriaItem {...defaultProps} />);
    expect(container.querySelector('span.bg-green-100')).toBeNull();
    expect(container.querySelector('span.bg-red-100')).toBeNull();
    expect(container.querySelector('span.bg-amber-100')).toBeNull();
  });

  it('devrait afficher la description si elle est présente', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithDescription} />);
    expect(screen.getByText(/Description du critère/)).toBeInTheDocument();
  });

  it('devrait afficher le bouton "Voir les tests" si des tests sont présents', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithTests} />);
    expect(screen.getByText(/Voir les tests/)).toBeInTheDocument();
  });

  it('ne devrait pas afficher le bouton "Voir les tests" si aucun test', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.queryByText(/Voir les tests/)).toBeNull();
  });

  it('devrait afficher les tests après clic sur "Voir les tests"', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithTests} />);
    const toggleButton = screen.getByText(/Voir les tests/);
    fireEvent.click(toggleButton);
    expect(screen.getByText(/Est-ce que l'image a un attribut/)).toBeInTheDocument();
  });

  it('devrait masquer les tests après double clic sur "Voir les tests"', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithTests} />);
    const toggleButton = screen.getByText(/Voir les tests/);
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    expect(screen.queryByText(/Est-ce que l'image a un attribut/)).toBeNull();
  });

  it('devrait afficher le bouton "Références" si des références sont présentes', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithReferences} />);
    expect(screen.getByText('Références')).toBeInTheDocument();
  });

  it('ne devrait pas afficher le bouton "Références" si aucune référence', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.queryByText('Références')).toBeNull();
  });

  it('devrait afficher les références WCAG après clic sur "Références"', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithReferences} />);
    fireEvent.click(screen.getByText('Références'));
    expect(screen.getByText('WCAG:')).toBeInTheDocument();
    expect(screen.getByText('1.1.1')).toBeInTheDocument();
  });

  it('devrait afficher les techniques après clic sur "Références"', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithReferences} />);
    fireEvent.click(screen.getByText('Références'));
    expect(screen.getByText('Techniques:')).toBeInTheDocument();
    expect(screen.getByText('G94')).toBeInTheDocument();
    expect(screen.getByText('H37')).toBeInTheDocument();
  });

  it('devrait avoir aria-expanded sur le bouton tests', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithTests} />);
    const toggleButton = screen.getByText(/Voir les tests/).closest('button');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggleButton!);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('devrait cocher le radio correspondant au statut actuel en mode classic', () => {
    render(<CriteriaItem {...defaultProps} currentStatus="non-applicable" />);
    const radio = screen.getByLabelText('Non applicable') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('devrait cocher le radio correspondant au statut actuel en mode design-system', () => {
    render(<CriteriaItem {...defaultProps} mode="design-system" currentStatus="project-implementation" />);
    const radio = screen.getByLabelText('À mettre en place') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });
});
