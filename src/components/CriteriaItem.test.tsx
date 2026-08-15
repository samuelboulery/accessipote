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
  tests: [{ id: '1.1.1', questions: ['Est-ce altéré ?'] }],
};

const criterionWithReferences: CriteriaRGAA = {
  ...baseCriterion,
  references: {
    wcag: ['1.1.1'],
    techniques: ['G94', 'H37'],
  },
};

const defaultProps = {
  criterion: baseCriterion,
  mode: 'classic' as const,
  onStatusChange: vi.fn(),
  onGlossaryClick: vi.fn(),
  onExpand: vi.fn(),
  isSelected: false,
  onSelectedChange: vi.fn(),
};

describe('CriteriaItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher l\'ID du critère', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.getByText('1.1')).toBeInTheDocument();
  });

  it('devrait afficher le titre du critère en h3', () => {
    render(<CriteriaItem {...defaultProps} />);
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Titre du critère 1.1');
  });

  it('devrait afficher le nombre de tests', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithTests} />);
    expect(screen.getByText('1 test')).toBeInTheDocument();
  });

  it('devrait afficher le lien WCAG quand présent', () => {
    render(<CriteriaItem {...defaultProps} criterion={criterionWithReferences} />);
    expect(screen.getByText('WCAG 1.1.1')).toBeInTheDocument();
    const wcagLink = screen.getByText('WCAG 1.1.1').closest('a');
    expect(wcagLink).toHaveAttribute('target', '_blank');
  });

  it('devrait afficher la StatusPill avec le statut', () => {
    const { container } = render(<CriteriaItem {...defaultProps} currentStatus="conforme" />);
    const article = container.querySelector('article');
    expect(article?.textContent).toContain('Conforme');
  });

  it('devrait afficher les StatusButtons en mode classic', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.getByLabelText('Conforme')).toBeInTheDocument();
    expect(screen.getByLabelText('Non conforme')).toBeInTheDocument();
    expect(screen.getByLabelText('Non applicable')).toBeInTheDocument();
  });

  it('devrait afficher les StatusButtons en mode design-system', () => {
    render(<CriteriaItem {...defaultProps} mode="design-system" />);
    expect(screen.getByLabelText('Conforme par défaut')).toBeInTheDocument();
    expect(screen.getByLabelText('À mettre en place')).toBeInTheDocument();
    expect(screen.getByLabelText('Non applicable')).toBeInTheDocument();
  });

  it('devrait appeler onStatusChange au clic sur un statut', () => {
    const onStatusChange = vi.fn();
    render(<CriteriaItem {...defaultProps} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByLabelText('Non conforme'));
    expect(onStatusChange).toHaveBeenCalledWith('1.1', 'non-conforme');
  });

  it('devrait afficher le bouton « Voir les tests »', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(screen.getByText('Voir les tests')).toBeInTheDocument();
  });

  it('devrait appeler onExpand au clic sur « Voir les tests »', () => {
    const onExpand = vi.fn();
    render(<CriteriaItem {...defaultProps} onExpand={onExpand} />);
    fireEvent.click(screen.getByText('Voir les tests'));
    expect(onExpand).toHaveBeenCalledWith('1.1');
  });

  it('devrait avoir un id critère-{criteriaId} pour lien profond', () => {
    const { container } = render(<CriteriaItem {...defaultProps} />);
    const article = container.querySelector('article');
    expect(article).toHaveAttribute('id', 'criteria-1.1');
  });

  it('devrait cocher le radio du statut actuel', () => {
    render(<CriteriaItem {...defaultProps} currentStatus="non-applicable" />);
    const radio = screen.getByLabelText('Non applicable') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('devrait supporter les labels de statut du mode design-system', () => {
    const { container } = render(<CriteriaItem {...defaultProps} mode="design-system" currentStatus="default-compliant" />);
    expect(container.textContent).toContain('Conforme par défaut');
  });

  it('expose une case de sélection nommant le critère', () => {
    render(<CriteriaItem {...defaultProps} />);
    expect(
      screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ }),
    ).not.toBeChecked();
  });

  it('remonte la sélection du critère', () => {
    const onSelectedChange = vi.fn();
    render(<CriteriaItem {...defaultProps} onSelectedChange={onSelectedChange} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ }));

    expect(onSelectedChange).toHaveBeenCalledWith('1.1', true);
  });

  it('reflète l\'état sélectionné', () => {
    render(<CriteriaItem {...defaultProps} isSelected />);
    expect(screen.getByRole('checkbox', { name: /Sélectionner le critère 1\.1/ })).toBeChecked();
  });
});
