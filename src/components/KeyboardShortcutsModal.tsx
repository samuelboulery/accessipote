import { X } from 'lucide-react';
import type { KeyboardShortcut } from '../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  shortcuts: KeyboardShortcut[];
  onClose: () => void;
}

const CATEGORY_LABELS: Record<KeyboardShortcut['category'], string> = {
  navigation: 'Navigation',
  export: 'Export',
  help: 'Aide',
};

export default function KeyboardShortcutsModal({
  isOpen,
  shortcuts,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories = ['navigation', 'export', 'help'] as const;

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="keyboard-shortcuts-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Raccourcis clavier
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Fermer les raccourcis clavier"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {categories.map((category) => {
            const categoryShortcuts = shortcuts.filter((s) => s.category === category);
            if (categoryShortcuts.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  {CATEGORY_LABELS[category]}
                </h3>
                <ul className="space-y-2">
                  {categoryShortcuts.map((shortcut) => (
                    <li
                      key={shortcut.action}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        {shortcut.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-700 dark:text-gray-300"
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
