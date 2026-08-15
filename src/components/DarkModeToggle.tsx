import { Moon, Sun, Monitor } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { THEME_CYCLE, type ThemeMode } from '../hooks/useDarkMode';

interface DarkModeToggleProps {
  mode: ThemeMode;
  onCycle: () => void;
}

const PRESENTATION: Record<ThemeMode, { Icon: LucideIcon; label: string }> = {
  light: { Icon: Sun, label: 'clair' },
  dark: { Icon: Moon, label: 'sombre' },
  system: { Icon: Monitor, label: 'système' },
};

/**
 * Trois états, pas deux : sans « système » l'utilisateur ne peut plus rendre la
 * main au navigateur une fois qu'il a choisi.
 */
export default function DarkModeToggle({ mode, onCycle }: DarkModeToggleProps) {
  const { Icon, label } = PRESENTATION[mode];
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length];

  return (
    <button
      type="button"
      onClick={onCycle}
      // Un bouton qui cycle doit dire où il en est ET où il va, sans quoi il
      // reste indéchiffrable au clavier comme au lecteur d'écran.
      aria-label={`Thème : ${label}. Passer au thème ${PRESENTATION[next].label}`}
      title={`Thème : ${label}`}
      className="target-44 flex h-ctrl w-ctrl flex-shrink-0 items-center justify-center rounded-ctrl border-1 border-border bg-surface"
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
