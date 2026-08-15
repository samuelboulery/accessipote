import { Moon, Sun } from 'lucide-react';

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Désactiver le mode sombre' : 'Activer le mode sombre'}
      className="target-44 flex h-ctrl w-ctrl flex-shrink-0 items-center justify-center rounded-ctrl border-1 border-border bg-surface"
    >
      {isDark ? (
        <Sun size={16} aria-hidden="true" />
      ) : (
        <Moon size={16} aria-hidden="true" />
      )}
    </button>
  );
}
