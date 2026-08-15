import { memo } from 'react';
import { Home, List, BarChart3, BookOpen } from 'lucide-react';
import type { View } from './Sidebar';

interface MobileTabBarProps {
  view: View;
  onNavigate: (view: View) => void;
}

const TABS: Array<{ view: View; label: string; Icon: typeof Home }> = [
  { view: 'home', label: 'Accueil', Icon: Home },
  { view: 'audit', label: 'Audit', Icon: List },
  { view: 'summary', label: 'Synthèse', Icon: BarChart3 },
  { view: 'glossary', label: 'Glossaire', Icon: BookOpen },
];

/** Cibles à 48px : 44px est le plancher desktop, 48 le plancher tactile. */
function MobileTabBar({ view, onNavigate }: MobileTabBarProps) {
  return (
    // Le padding bas suit l'indicateur d'accueil iOS quand il existe, et retombe
    // sur 8px partout ailleurs — sinon la dernière rangée d'onglets passe dessous.
    //
    // Rien d'autre que des destinations ici : la bascule de thème est passée dans
    // la barre supérieure, un contrôle sans page n'a pas sa place au milieu d'une
    // navigation.
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-separator bg-surface px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <nav aria-label="Navigation principale" className="flex">
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
    </div>
  );
}

export default memo(MobileTabBar);
