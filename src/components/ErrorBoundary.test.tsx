import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Composant qui lance une erreur lors du rendu
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Erreur de test');
  }
  return <div>Contenu normal</div>;
}

describe('ErrorBoundary', () => {
  // Supprimer les erreurs dans la console pour les tests de crash
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait afficher les enfants quand il n\'y a pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  it('devrait afficher le fallback par défaut en cas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Une erreur s\'est produite')).toBeInTheDocument();
  });

  it('devrait afficher le message d\'erreur convivial', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/rafraîchir la page ou réessayer/i)).toBeInTheDocument();
  });

  it('devrait afficher un fallback personnalisé si fourni', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback personnalisé</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Fallback personnalisé')).toBeInTheDocument();
    expect(screen.queryByText('Une erreur s\'est produite')).toBeNull();
  });

  it('devrait afficher un bouton de rechargement', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Rafraîchir la page')).toBeInTheDocument();
  });

  it('devrait loguer l\'erreur via console.error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('devrait réinitialiser l\'état lors du clic sur rafraîchir', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Rafraîchir la page'));
    expect(reloadMock).toHaveBeenCalled();
  });
});
