import { Bot } from 'lucide-react';
import type { AutoVerdict } from '../types';

interface AutoBadgeProps {
  auto?: AutoVerdict;
}

/**
 * Marqueur de provenance d'un statut posé par le scan automatique.
 *
 * Une case cochée par un robot sans traçabilité est un risque juridique : le
 * marqueur dit qui a tranché, sur quels tests, quand et sur quoi. Icône et
 * libellé, jamais la couleur seule.
 *
 * Le marqueur ne survit pas à l'humain : `audit.auto[id]` est supprimé dès que
 * le statut change à la main, donc ce composant disparaît de lui-même.
 */
export default function AutoBadge({ auto }: AutoBadgeProps) {
  if (!auto) return null;

  const scannedAt = new Date(auto.scannedAt).toLocaleDateString('fr-FR');
  const libelle = auto.fromHint
    ? `Posé sur un indice du scan du ${scannedAt}`
    : `Pré-rempli par le scan du ${scannedAt}`;

  return (
    <details className="w-full rounded-ctrl border-1 border-border bg-sunk px-3 py-2 text-meta">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
        <Bot size={14} aria-hidden="true" />
        {libelle}
      </summary>

      {auto.testIds.length > 0 && (
        <p className="mt-2 text-ink-muted">
          Test{auto.testIds.length > 1 ? 's' : ''} {auto.testIds.join(', ')}
        </p>
      )}

      <ul className="mt-2 flex flex-col gap-2">
        {auto.evidence.map((evidence, index) => (
          <li key={index} className="flex flex-col gap-1 break-words">
            <span className="text-ink-muted">{evidence.url}</span>
            {evidence.selector && <code className="font-mono">{evidence.selector}</code>}
          </li>
        ))}
      </ul>
    </details>
  );
}
