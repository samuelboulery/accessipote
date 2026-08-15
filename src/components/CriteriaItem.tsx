import { useMemo, memo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CriteriaRGAA, Mode, CriteriaStatus } from '../types';
import { parseMarkdownLinks } from '../utils/parseMarkdown';
import { getWcagCriteriaUrl, parseWcagReference } from '../utils/generateWcagLinks';
import { getStatusPresentation } from '../utils/statusPresentation';
import StatusPill from './StatusPill';
import StatusButtons from './StatusButtons';

interface CriteriaItemProps {
  criterion: CriteriaRGAA;
  mode: Mode;
  currentStatus?: CriteriaStatus;
  onStatusChange: (criteriaId: string, status: CriteriaStatus | '') => void;
  onGlossaryClick: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
  onExpand: (criteriaId: string) => void;
}

function CriteriaItem({
  criterion,
  mode,
  currentStatus,
  onStatusChange,
  onGlossaryClick,
  onCriteriaClick,
  onExpand,
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
      className={`rounded-card border-1 p-3 ${cardClass}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="rounded-ctrl bg-sunk px-2 py-1 font-mono text-meta font-semibold">
          {criterion.id}
        </span>
        {testCount > 0 && (
          <span className="font-mono text-meta text-ink-muted">
            {testCount} test{testCount > 1 ? 's' : ''}
          </span>
        )}
        {wcag && wcag.number && (
          <>
            <span aria-hidden="true" className="text-ink-muted">·</span>
            <a
              href={getWcagCriteriaUrl(wcagRef)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-meta underline underline-offset-2"
            >
              WCAG {wcag.number}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </>
        )}
        <span className="flex-1" />
        <StatusPill status={currentStatus} mode={mode} />
      </div>

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
          className="text-body underline underline-offset-2"
        >
          Voir les tests
        </button>
      </div>
    </article>
  );
}

export default memo(CriteriaItem);
