import { ListChecks, Plus, BarChart3 } from 'lucide-react';
import EmptyState from './EmptyState';

export type NoAuditTarget = 'audit' | 'summary';

interface NoAuditStateProps {
  target: NoAuditTarget;
  /** Des audits existent-ils ? Décide du texte et de l'action proposée. */
  hasAudits: boolean;
  onGoHome: () => void;
  onCreateAudit: () => void;
}

/**
 * Deux écrans, quatre textes : ce qu'on propose dépend de ce qui existe déjà.
 * Renvoyer à l'accueil quelqu'un qui n'a aucun audit est une impasse ; proposer
 * d'en créer un à qui en a douze ignore son travail.
 */

const COPY = {
  audit: {
    Icon: ListChecks,
    empty: {
      title: 'Rien à évaluer pour l\'instant',
      body: 'Un audit, c\'est les critères du RGAA à statuer, thème par thème. Crées-en un et cet écran se remplira au fil de tes réponses.',
    },
    idle: {
      title: 'Aucun audit ouvert',
      body: 'Tes audits sont sur l\'accueil. Reprends celui que tu veux, tu retrouveras tes statuts, tes notes et tes pages.',
    },
  },
  summary: {
    Icon: BarChart3,
    empty: {
      title: 'Pas encore de synthèse',
      body: 'La synthèse calcule ton taux de conformité à partir des critères tranchés. Elle apparaîtra dès que tu auras démarré un audit.',
    },
    idle: {
      title: 'Aucun audit ouvert',
      body: 'Ouvre un audit depuis l\'accueil pour voir sa synthèse : taux de conformité, répartition et détail par thème.',
    },
  },
} as const;

export default function NoAuditState({
  target,
  hasAudits,
  onGoHome,
  onCreateAudit,
}: NoAuditStateProps) {
  const { Icon, ...variants } = COPY[target];
  const { title, body } = hasAudits ? variants.idle : variants.empty;

  return (
    <EmptyState
      title={title}
      body={body}
      Icon={Icon}
      actions={
        <button
          type="button"
          onClick={hasAudits ? onGoHome : onCreateAudit}
          className="flex h-prim items-center justify-center gap-2 rounded-ctrl bg-ink px-6 text-lead font-semibold text-surface"
        >
          {hasAudits ? null : <Plus size={16} strokeWidth={2.2} aria-hidden="true" />}
          {hasAudits ? 'Choisir un audit' : 'Démarrer un premier audit'}
        </button>
      }
    />
  );
}
