import { memo } from 'react';
import type { Mode } from '../types';

interface ModeSelectorProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Mode de vérification</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mode === 'classic'
              ? 'Conforme / Non conforme / Non applicable'
              : 'Conforme par défaut / À mettre en place / Non applicable'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${mode === 'classic' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            Classique
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={mode === 'design-system'}
            onClick={() => onModeChange(mode === 'classic' ? 'design-system' : 'classic')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              mode === 'design-system' ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform ${
                mode === 'design-system' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${mode === 'design-system' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            Design System
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(ModeSelector);
