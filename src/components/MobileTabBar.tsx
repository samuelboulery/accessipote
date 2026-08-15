import { memo } from 'react';
import { Home, List, BarChart3, BookOpen } from 'lucide-react';
import type { View } from './Sidebar';
import DarkModeToggle from './DarkModeToggle';
import type { ThemeMode } from '../hooks/useDarkMode';

interface MobileTabBarProps {
  view: View;
  onNavigate: (view: View) => void;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
}

const TABS: Array<{ view: View; label: string; Icon: typeof Home }> = [
  { view: 'home', label: 'Accueil', Icon: Home },
  { view: 'audit', label: 'Audit', Icon: List },
  { view: 'summary', label: 'Synthèse', Icon: BarChart3 },
  { view: 'glossary', label: 'Glossaire', Icon: BookOpen },
];

/** Cibles à 48px : 44px est le plancher desktop, 48 le plancher tactile. */
function MobileTabBar({ view, onNavigate, themeMode, onCycleTheme }: MobileTabBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-separator bg-surface p-2">
      <nav aria-label="Navigation principale" className="flex flex-1">
        {TABS.map(({ view: target, label, Icon }) => {
          const isActive = view === target;
          return (
            <button
              key={target}
              type="button"
              onClick={() => onNavigate(target)}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex h-prim flex-1 flex-col items-center justify-center gap-1 rounded-ctrl',
                isActive ? 'bg-ink font-semibold text-surface' : 'text-ink-muted',
              ].join(' ')}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="text-meta">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Hors du <nav> : ce n'est pas une destination, elle ne doit pas être
          annoncée comme telle. */}
      <DarkModeToggle mode={themeMode} onCycle={onCycleTheme} />
    </div>
  );
}

export default memo(MobileTabBar);
