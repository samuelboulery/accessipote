import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage, ToastType } from '../types';

interface ToastProps {
  toasts: Record<string, ToastMessage>;
  onDismiss: (id: string) => void;
}

function getToastStyles(type: ToastType): { bg: string; border: string; text: string } {
  const styles = {
    success: {
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-800',
    },
    error: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-800',
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-800',
    },
  };
  return styles[type];
}

function getToastIcon(type: ToastType) {
  const iconProps = { className: 'w-5 h-5 flex-shrink-0' };

  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} />;
    case 'error':
      return <AlertCircle {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
  }
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  const toastList = Object.values(toasts);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
    >
      {toastList.map(toast => {
        const styles = getToastStyles(toast.type);

        return (
          <div
            key={toast.id}
            data-testid={`toast-${toast.id}`}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg border
              motion-safe:transition-all
              ${styles.bg} ${styles.text} ${styles.border}
            `}
          >
            <div className="flex-shrink-0">{getToastIcon(toast.type)}</div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Fermer la notification"
              className="flex-shrink-0 text-current hover:opacity-70 motion-safe:transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
