import { memo } from 'react';
import type { CriteriaStatus, Mode } from '../types';
import { getStatusPresentation } from '../utils/statusPresentation';

interface StatusPillProps {
  status: CriteriaStatus | undefined;
  mode: Mode;
}

/**
 * Le seul rendu de statut de l'application. Icône de forme distincte + libellé +
 * fond : la couleur ne porte jamais l'information seule.
 */
function StatusPill({ status, mode }: StatusPillProps) {
  const { label, Icon, pillClass } = getStatusPresentation(status, mode);

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-pill px-3 py-1 text-meta font-semibold ${pillClass}`}
    >
      {/* Une coche fine se perd à 12px, d'où le stroke épaissi. */}
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {label}
    </span>
  );
}

export default memo(StatusPill);
