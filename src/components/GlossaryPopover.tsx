import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { GlossaryTerm } from '../types';

interface GlossaryPopoverProps {
  term: GlossaryTerm;
  /** Rectangle du terme cliqué : le popover s'ouvre depuis lui, pas du centre. */
  anchor: DOMRect;
  onClose: () => void;
  onOpenInGlossary: () => void;
}

const WIDTH = 320;

/** Extrait lisible : le corps du glossaire est du HTML. */
function excerpt(body: string, limit = 260): string {
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

export default function GlossaryPopover({
  term,
  anchor,
  onClose,
  onOpenInGlossary,
}: GlossaryPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [onClose]);

  // Recadrer dans la fenêtre : ancré à gauche du terme, il déborderait à droite
  // de l'écran pour un terme situé en fin de ligne.
  const left = Math.min(Math.max(8, anchor.left), window.innerWidth - WIDTH - 8);
  const top = anchor.bottom + 8;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Définition : ${term.title}`}
      tabIndex={-1}
      style={{ left, top, width: WIDTH }}
      className="fixed z-30 rounded-card bg-ink p-4 text-surface shadow-panel"
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 font-mono text-meta uppercase tracking-[0.08em] opacity-80">
          Glossaire RGAA
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la définition"
          className="-m-1 p-1"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-2 text-body font-semibold">{term.title}</p>
      <p className="mt-2 text-dense opacity-80">{excerpt(term.body)}</p>

      <button
        type="button"
        onClick={onOpenInGlossary}
        className="mt-3 text-dense underline underline-offset-2"
      >
        Ouvrir dans le glossaire →
      </button>
    </div>
  );
}
