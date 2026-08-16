import { memo } from 'react';

/** Boîte -> rayon et épaisseur. L'épaisseur vaut le diamètre divisé par 8. */
const GEOMETRY = {
  48: { r: 21, stroke: 6 },
  56: { r: 24, stroke: 7 },
  128: { r: 56, stroke: 16 },
} as const;

export type AuditRingSize = keyof typeof GEOMETRY;

export interface RingSegment {
  key: string;
  /** Part du cercle, entre 0 et 1. */
  share: number;
  color: string;
}

interface AuditRingProps {
  size: AuditRingSize;
  /** Segments dans l'ordre de tracé. Un anneau de progression n'en a qu'un. */
  segments: RingSegment[];
  /** Énoncé complet de la répartition — l'anneau n'est jamais la seule source. */
  label: string;
  /** Écart en pixels entre deux segments. 4 pour le donut de synthèse. */
  gap?: number;
  children?: React.ReactNode;
}

/**
 * Le `stroke-dasharray` est calculé, jamais écrit à la main : une valeur en dur
 * se désynchronise du rayon dès qu'une taille change.
 */
function arc(r: number, share: number, gap: number) {
  const circumference = 2 * Math.PI * r;
  const on = Math.max(share * circumference - gap, share > 0 ? 1 : 0);
  return `${on.toFixed(1)} ${(circumference - on).toFixed(1)}`;
}

function AuditRing({ size, segments, label, gap = 0, children }: AuditRingProps) {
  const { r, stroke } = GEOMETRY[size];
  const center = size / 2;
  const circumference = 2 * Math.PI * r;

  // Chaque segment démarre là où les précédents s'arrêtent. Le décalage est
  // donc cumulatif, et se calcule avant le rendu : muter un compteur pendant
  // le `map` produirait un résultat dépendant de l'ordre d'évaluation.
  const offsets: number[] = [];
  segments.reduce((consumed, segment) => {
    offsets.push(-consumed * circumference);
    return consumed + segment.share;
  }, 0);

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--a-track)" strokeWidth={stroke} />
        {segments.map((segment, index) => {
          const offset = offsets[index];
          if (segment.share <= 0) return null;
          return (
            <circle
              key={segment.key}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke={segment.color}
              strokeWidth={stroke}
              strokeDasharray={arc(r, segment.share, gap)}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}
      </svg>
      {children != null && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          {children}
        </span>
      )}
    </span>
  );
}

export default memo(AuditRing);
