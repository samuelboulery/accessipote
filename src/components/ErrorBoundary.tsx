import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ErrorInfo, ReactNode } from 'react';
import { logError } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary React pour capturer les erreurs dans l'arbre de composants
 * Affiche un message d'erreur convivial à l'utilisateur au lieu de crasher l'application
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour afficher l'UI de fallback lors du prochain rendu
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // logError se tait hors développement : rien ne doit fuir en console en
    // production, pas même une trace d'erreur.
    logError('Erreur interceptée par ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // UI de fallback personnalisée si fournie
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback par défaut
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg p-4">
          <div className="w-full max-w-md rounded-card bg-surface p-6 shadow-panel">
            <div className="mx-auto mb-4 flex h-two w-two items-center justify-center rounded-pill bg-ko-bg">
<AlertTriangle className="h-8 w-8 text-ko-fg" aria-hidden="true" />
            </div>
            <h1 className="mb-2 text-center text-section font-semibold">
              Une erreur s'est produite
            </h1>
            <p className="mb-6 text-center text-body text-ink-muted">
              L'application a rencontré un problème. Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <details className="mb-4">
                <summary className="cursor-pointer text-dense text-ink-muted">
                  Détails de l'erreur (mode développement)
                </summary>
                <pre className="mt-2 overflow-auto rounded-ctrl bg-sunk p-3 font-mono text-meta">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="h-prim w-full rounded-ctrl bg-ink text-body font-semibold text-surface"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

