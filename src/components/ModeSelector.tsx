import { memo } from 'react';
import type { Mode } from '../types';

interface ModeSelectorProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Mode de vérification</h2>
          <p className="text-sm text-gray-600">
            {mode === 'classic' 
              ? 'Conforme / Non conforme / Non applicable'
              : 'Conforme par défaut / À mettre en place'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${mode === 'classic' ? 'text-gray-900' : 'text-gray-500'}`}>
            Classique
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={mode === 'design-system'}
            onClick={() => onModeChange(mode === 'classic' ? 'design-system' : 'classic')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              mode === 'design-system' ? 'bg-black' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                mode === 'design-system' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${mode === 'design-system' ? 'text-gray-900' : 'text-gray-500'}`}>
            Design System
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(ModeSelector);
