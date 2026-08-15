import type { LucideIcon } from 'lucide-react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  /** Dire ce qui a été cherché *et* ce qui existe ailleurs — jamais un « aucun
   *  résultat » sec, qui laisse l'utilisateur sans porte de sortie. */
  body: string;
  Icon?: LucideIcon;
  actions?: React.ReactNode;
}

export default function EmptyState({ title, body, Icon = SearchX, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span className="flex h-touch w-touch items-center justify-center rounded-ctrl bg-sunk">
        <Icon size={20} aria-hidden="true" />
      </span>
      <h2 className="text-lead font-semibold">{title}</h2>
      <p className="max-w-[44ch] text-dense text-ink-muted">{body}</p>
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
