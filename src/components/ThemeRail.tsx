import { memo, useRef } from 'react';
import { Check } from 'lucide-react';

export interface ThemeProgress {
  theme: string;
  evaluated: number;
  total: number;
}

interface ThemeRailProps {
  themes: ThemeProgress[];
  activeTheme: string;
  onThemeChange: (theme: string) => void;
}

/**
 * Sélecteur de vue, pas filtre : on ne voit qu'un thème à la fois. D'où le
 * `tablist` et la sélection unique, là où l'ancien multi-select disait « montre
 * aussi ceux-là ».
 */
function ThemeRail({ themes, activeTheme, onThemeChange }: ThemeRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;

    event.preventDefault();
    const index = themes.findIndex(t => t.theme === activeTheme);
    const nextIndex = (index + delta + themes.length) % themes.length;
    const next = themes[nextIndex];
    onThemeChange(next.theme);
    railRef.current
      ?.querySelector<HTMLButtonElement>(`[data-theme="${CSS.escape(next.theme)}"]`)
      ?.focus();
  };

  return (
    <div
      ref={railRef}
      role="tablist"
      aria-label="Thèmes de l'audit"
      onKeyDown={handleKeyDown}
      className="flex gap-2 overflow-x-auto whitespace-nowrap"
    >
      {themes.map(({ theme, evaluated, total }) => {
        const isActive = theme === activeTheme;
        const isComplete = total > 0 && evaluated === total;

        return (
          <button
            key={theme}
            type="button"
            role="tab"
            data-theme={theme}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onThemeChange(theme)}
            className={[
              'relative flex h-chip flex-shrink-0 items-center gap-2 rounded-pill px-3 text-body',
              // 32px de haut, mais la cible réelle est portée à 44px.
              "before:absolute before:inset-x-0 before:-top-[6px] before:-bottom-[6px] before:content-['']",
              isActive
                ? 'bg-ink font-semibold text-surface'
                : 'border-1 border-border bg-surface font-medium',
            ].join(' ')}
          >
            {theme}
            <span className="font-mono text-meta opacity-70">
              {evaluated}/{total}
            </span>
            {isComplete && <Check size={12} strokeWidth={2.6} aria-label="thème complet" />}
          </button>
        );
      })}
    </div>
  );
}

export default memo(ThemeRail);
