import { Plus, ChevronRight, BookOpen, Upload } from 'lucide-react';
import type { Audit } from '../types';
import AccessipoteLogo from './AccessipoteLogo';
import AuditRing from './AuditRing';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export interface AuditSummary {
  audit: Audit;
  evaluated: number;
  total: number;
}

interface HomeScreenProps {
  audits: AuditSummary[];
  glossaryCount: number;
  onOpenAudit: (auditId: string) => void;
  onCreateAudit: () => void;
  onOpenGlossary: () => void;
}

const MODE_LABEL = {
  'classic': 'Mode classique',
  'design-system': 'Mode design system',
} as const;

export default function HomeScreen({
  audits,
  glossaryCount,
  onOpenAudit,
  onCreateAudit,
  onOpenGlossary,
}: HomeScreenProps) {
  const hasAudits = audits.length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-frame bg-bg p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ctrl bg-ink text-surface">
          <AccessipoteLogo size={16} />
        </span>
        <span className="text-lead font-semibold">Accessipote</span>
        <span className="flex-1" />
        <span className="font-mono text-meta text-ink-muted">RGAA 4.1</span>
      </div>

      <div>
        <h1 className="text-screen font-semibold">On reprend où on en était ?</h1>
        <p className="mt-2 text-lead text-ink-muted">
          {hasAudits
            ? `${audits.length} audit${audits.length > 1 ? 's' : ''} ouvert${audits.length > 1 ? 's' : ''}. Tout reste dans ce navigateur.`
            : 'Aucun audit pour le moment. Tout reste dans ce navigateur, rien n\'est envoyé ailleurs.'}
        </p>
      </div>

      {hasAudits && (
        <ul className="flex flex-col gap-3">
          {audits.map(({ audit, evaluated, total }) => {
            const share = total > 0 ? evaluated / total : 0;
            const percentage = Math.round(share * 100);

            return (
              <li key={audit.id}>
                <button
                  type="button"
                  onClick={() => onOpenAudit(audit.id)}
                  className="grid w-full grid-cols-[48px_1fr_auto_16px] items-center gap-4 rounded-card border-1 border-border bg-surface px-4 py-3 text-left"
                >
                  <AuditRing
                    size={48}
                    segments={[{ key: 'evalues', share, color: 'var(--a-ink)' }]}
                    label={`${percentage} % évalué`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-lead font-semibold">{audit.name}</span>
                    <span className="mt-1 block text-dense text-ink-muted">
                      {MODE_LABEL[audit.mode]} · modifié {formatRelativeTime(audit.updatedAt)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-body font-semibold">{percentage}%</span>
                    <span className="mt-1 block font-mono text-meta text-ink-muted">
                      {evaluated} / {total}
                    </span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" className="text-ink-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onCreateAudit}
        className="flex h-prim items-center justify-center gap-2 rounded-card bg-ink px-4 text-lead font-semibold text-surface"
      >
        <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
        Démarrer un nouvel audit
      </button>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onOpenGlossary}
          className="flex-1 rounded-card border-1 border-border bg-surface p-4 text-left"
        >
          <span className="mb-1 flex items-center gap-2 text-body font-semibold">
            <BookOpen size={16} aria-hidden="true" />
            Glossaire
          </span>
          <span className="block text-meta text-ink-muted">
            {glossaryCount} définitions RGAA, consultables sans ouvrir d'audit.
          </span>
        </button>
        <div className="flex-1 rounded-card border-1 border-dashed border-dashed p-4">
          <span className="mb-1 flex items-center gap-2 text-body font-semibold text-ink-muted">
            <Upload size={16} aria-hidden="true" />
            Importer un rapport
          </span>
          <span className="block text-meta text-ink-muted">Bientôt disponible.</span>
        </div>
      </div>
    </div>
  );
}
