import { useMemo, memo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { AutoVerdict, CriteriaRGAA, Mode, CriteriaStatus } from '../types';
import { parseMarkdownLinks } from '../utils/parseMarkdown';
import { getWcagCriteriaUrl, parseWcagReference } from '../utils/generateWcagLinks';
import { getStatusPresentation } from '../utils/statusPresentation';
import StatusPill from './StatusPill';
import StatusButtons from './StatusButtons';
import AutoBadge from './AutoBadge';

interface CriteriaItemProps {
  criterion: CriteriaRGAA;
  mode: Mode;
  currentStatus?: CriteriaStatus;
  /** Provenance du scan, tant que l'humain n'a pas repris la main sur le statut. */
  auto?: AutoVerdict;
  onStatusChange: (criteriaId: string, status: CriteriaStatus | '') => void;
  onGlossaryClick: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
  onExpand: (criteriaId: string) => void;
  isSelected: boolean;
  onSelectedChange: (criteriaId: string, selected: boolean) => void;
}

function CriteriaItem({
  criterion,
  mode,
  currentStatus,
  auto,
  onStatusChange,
  onGlossaryClick,
  onCriteriaClick,
  onExpand,
  isSelected,
  onSelectedChange,
}: CriteriaItemProps) {
  const parsedTitle = useMemo(
    () => parseMarkdownLinks(criterion.title, { onGlossaryClick, onCriteriaClick }),
    [criterion.title, onGlossaryClick, onCriteriaClick],
  );

  // Le fond n'est qu'un rappel discret du statut : la pastille reste ce qui le dit.
  const { cardClass } = getStatusPresentation(currentStatus, mode);
  const testCount = criterion.tests?.length ?? 0;
  const wcagRef = criterion.references?.wcag?.[0];
  const wcag = wcagRef ? parseWcagReference(wcagRef) : null;

  return (
    <article
      id={`criteria-${criterion.id}`}
      tabIndex={-1}
      className={`rounded-card border-1 p-4 ${cardClass}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="-m-3 flex h-touch w-touch cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={event => onSelectedChange(criterion.id, event.target.checked)}
            aria-label={`Sélectionner le critère ${criterion.id}`}
            className="h-icon-lg w-icon-lg cursor-pointer rounded-ctrl"
          />
        </label>
        <span className="rounded-ctrl bg-sunk px-2 py-1 font-mono text-meta font-semibold">
          {criterion.id}
        </span>
        {testCount > 0 && (
          <span className="font-mono text-meta text-ink-muted">
            {testCount} test{testCount > 1 ? 's' : ''}
          </span>
        )}
        <span aria-hidden="true" className="text-ink-muted">·</span>
        {/* Le RGAA fait foi ici : il passe en premier, le WCAG vient en appui. */}
        <a
          href={criterion.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-meta font-semibold underline underline-offset-2"
        >
          RGAA {criterion.id}
          <ExternalLink size={12} aria-hidden="true" />
        </a>
        {wcag && wcag.number && (
          <>
            <span aria-hidden="true" className="text-ink-muted">·</span>
            <a
              href={getWcagCriteriaUrl(wcagRef)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-meta text-ink-muted underline underline-offset-2"
            >
              WCAG {wcag.number}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </>
        )}
        <span className="flex-1" />
        <StatusPill status={currentStatus} mode={mode} />
      </div>

      {auto && (
        <div className="mb-3">
          <AutoBadge auto={auto} />
        </div>
      )}

      <h3 className="mb-3 max-w-[66ch] text-lead font-semibold [text-wrap:pretty]">
        {parsedTitle}
      </h3>

      <div className="flex flex-wrap items-center gap-3">
        <StatusButtons
          criteriaId={criterion.id}
          criteriaTitle={criterion.title}
          mode={mode}
          currentStatus={currentStatus}
          onStatusChange={onStatusChange}
          density="card"
        />
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onExpand(criterion.id)}
          className="py-3 text-body underline underline-offset-2"
        >
          Voir les tests
        </button>
      </div>
    </article>
  );
}

export default memo(CriteriaItem);
