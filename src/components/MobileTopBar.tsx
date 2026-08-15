import { memo } from 'react';
import AccessipoteLogo from './AccessipoteLogo';
import DarkModeToggle from './DarkModeToggle';
import type { ThemeMode } from '../hooks/useDarkMode';

interface MobileTopBarProps {
  themeMode: ThemeMode;
  onCycleTheme: () => void;
}

/**
 * En dessous de 640px la barre latérale n'est plus montée, et avec elle
 * disparaissaient le nom de l'application et la bascule de thème. Cette barre
 * les reprend, et rien d'autre : la navigation reste aux onglets du bas, à
 * portée de pouce.
 *
 * `sticky` plutôt que `fixed` — elle occupe sa place dans le flux, il n'y a donc
 * pas de décalage à compenser en tête de contenu.
 */
function MobileTopBar({ themeMode, onCycleTheme }: MobileTopBarProps) {
  return (
    <div className="sticky top-0 z-20 flex flex-shrink-0 items-center justify-between gap-2 bg-bg px-4 pt-[env(safe-area-inset-top)]">
      <span className="flex h-touch items-center gap-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ctrl bg-ink text-surface">
          <AccessipoteLogo size={16} />
        </span>
        <span className="text-lead font-semibold">Accessipote</span>
      </span>

      <DarkModeToggle mode={themeMode} onCycle={onCycleTheme} />
    </div>
  );
}

export default memo(MobileTopBar);
