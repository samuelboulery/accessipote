import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage, ToastType } from '../types';

interface ToastProps {
  toasts: Record<string, ToastMessage>;
  onDismiss: (id: string) => void;
}

/**
 * L'icône porte le type autant que le fond : un toast d'erreur doit rester
 * reconnaissable en niveaux de gris.
 */
const PRESENTATION: Record<ToastType, { Icon: typeof Info; className: string }> = {
  success: { Icon: CheckCircle, className: 'bg-ok-bg text-ok-fg border-ok-line' },
  error: { Icon: AlertCircle, className: 'bg-ko-bg text-ko-fg border-ko-line' },
  info: { Icon: Info, className: 'bg-sunk text-ink border-border' },
};

export default function Toast({ toasts, onDismiss }: ToastProps) {
  const toastList = Object.values(toasts);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-[360px] flex-col gap-2"
    >
      {toastList.map(toast => {
        const { Icon, className } = PRESENTATION[toast.type];

        return (
          <div
            key={toast.id}
            data-testid={`toast-${toast.id}`}
            className={`flex items-center gap-3 rounded-card border-1 p-4 motion-safe:transition-all ${className}`}
          >
            <Icon size={16} strokeWidth={2.6} className="flex-shrink-0" aria-hidden="true" />
            <p className="flex-1 text-body font-medium">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Fermer la notification"
              className="flex-shrink-0 text-current hover:opacity-70 motion-safe:transition-opacity"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
