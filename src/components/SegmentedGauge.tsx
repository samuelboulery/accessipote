import { memo } from 'react';

export interface GaugeSegment {
  key: string;
  /** Nombre de critères — la part est calculée à partir du total. */
  count: number;
  color: string;
}

interface SegmentedGaugeProps {
  segments: GaugeSegment[];
  total: number;
  /** Énoncé complet de la répartition, en toutes lettres. */
  label: string;
  className?: string;
}

/**
 * Deux teintes adjacentes sans séparation se lisent comme un seul bloc dès qu'on
 * perd la discrimination chromatique : l'écart de 2px entre segments est le
 * filet qui les garde distinguables en niveaux de gris. C'est le `gap` qui le
 * produit, pas une bordure — une bordure serait elle-même une couleur à lire.
 */
function SegmentedGauge({ segments, total, label, className = '' }: SegmentedGaugeProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`flex h-2 gap-[2px] overflow-hidden rounded-pill bg-track ${className}`}
    >
      {segments.map(segment => {
        if (segment.count <= 0 || total <= 0) return null;
        return (
          <span
            key={segment.key}
            className="block h-2"
            style={{ width: `${(segment.count / total) * 100}%`, background: segment.color }}
          />
        );
      })}
    </span>
  );
}

export default memo(SegmentedGauge);
