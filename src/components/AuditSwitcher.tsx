import { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check, Plus, List } from 'lucide-react';
import type { Audit, Mode } from '../types';

export interface SwitchableAudit {
  audit: Audit;
  evaluated: number;
  total: number;
}

interface AuditSwitcherProps {
  activeAudit: Audit;
  audits: SwitchableAudit[];
  onSelectAudit: (auditId: string) => void;
  onSeeAllAudits: () => void;
  onCreateAudit: () => void;
}

const MODE_LABEL: Record<Mode, string> = {
  'classic': 'Mode classique',
  'design-system': 'Mode design system',
};

/**
 * Le bouton annonçait un sélecteur et faisait une navigation vers l'accueil.
 * Il bascule désormais réellement d'audit, sans quitter l'écran courant.
 */
export default function AuditSwitcher({
  activeAudit,
  audits,
  onSelectAudit,
  onSeeAllAudits,
  onCreateAudit,
}: AuditSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
        aria-label={`Audit courant : ${activeAudit.name}. Changer d'audit`}
        className="flex h-two w-full items-center gap-3 rounded-ctrl border-1 border-border bg-surface px-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold">{activeAudit.name}</span>
          <span className="mt-1 block font-mono text-meta text-ink-muted">
            {MODE_LABEL[activeAudit.mode]}
          </span>
        </span>
        <ChevronsUpDown size={16} aria-hidden="true" className="flex-shrink-0 text-ink-muted" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-card border-1 border-border bg-surface p-4 shadow-panel">
          <h2 className="mb-2 text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Tes audits
          </h2>

          <ul className="mb-2 flex max-h-[240px] flex-col gap-1 overflow-y-auto">
            {audits.map(({ audit, evaluated, total }) => {
              const isActive = audit.id === activeAudit.id;
              return (
                <li key={audit.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAudit(audit.id);
                      setIsOpen(false);
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    className={[
                      'flex w-full items-center gap-2 rounded-ctrl p-3 text-left',
                      isActive ? 'bg-sunk font-semibold' : '',
                    ].join(' ')}
                  >
                    {/* L'audit actif porte une coche, pas seulement un fond. */}
                    <Check
                      size={16}
                      strokeWidth={2.6}
                      aria-hidden="true"
                      className={isActive ? '' : 'invisible'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body">{audit.name}</span>
                      <span className="mt-1 block font-mono text-meta text-ink-muted">
                        {evaluated} / {total}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-1 border-t border-separator pt-2">
            <button
              type="button"
              onClick={() => {
                onSeeAllAudits();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 rounded-ctrl p-3 text-left text-body"
            >
              <List size={16} aria-hidden="true" />
              Voir tous les audits
            </button>
            <button
              type="button"
              onClick={() => {
                onCreateAudit();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 rounded-ctrl p-3 text-left text-body font-semibold"
            >
              <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
              Nouvel audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
