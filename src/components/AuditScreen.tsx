import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { Audit, CriteriaFilters, CriteriaRGAA, CriteriaStatus } from '../types';
import SearchFilters from './SearchFilters';
import ThemeRail from './ThemeRail';
import CriteriaList from './CriteriaList';
import CriteriaDetail from './CriteriaDetail';
import SegmentedGauge from './SegmentedGauge';
import EmptyState from './EmptyState';
import BulkActions from './BulkActions';
import { useFilters } from '../hooks/useFilters';
import { getStatusPresentation } from '../utils/statusPresentation';
import { cleanCriteriaTitle } from '../utils/stripMarkdown';

interface AuditScreenProps {
  audit: Audit;
  criteriaList: CriteriaRGAA[];
  themes: string[];
  activeTheme: string;
  onThemeChange: (theme: string) => void;
  filters: CriteriaFilters;
  onFiltersChange: (filters: CriteriaFilters) => void;
  expandedCriteriaId: string | null;
  onExpand: (criteriaId: string | null) => void;
  onStatusChange: (criteriaId: string, status: CriteriaStatus | '') => void;
  onCheckedTestsChange: (criteriaId: string, testIds: string[]) => void;
  onNoteChange: (criteriaId: string, note: string) => void;
  onPagesChange: (criteriaId: string, pages: string[]) => void;
  onGlossaryClick: (slug: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  toolbarActions?: React.ReactNode;
}

export default function AuditScreen({
  audit,
  criteriaList,
  themes,
  activeTheme,
  onThemeChange,
  filters,
  onFiltersChange,
  expandedCriteriaId,
  onExpand,
  onStatusChange,
  onCheckedTestsChange,
  onNoteChange,
  onPagesChange,
  onGlossaryClick,
  searchInputRef,
  toolbarActions,
}: AuditScreenProps) {
  const progress = audit.progress;

  const themeCriteria = useMemo(
    () => criteriaList.filter(criterion => criterion.theme === activeTheme),
    [criteriaList, activeTheme],
  );

  const { filteredCriteria, uniqueLevels } = useFilters(themeCriteria, filters, progress);

  const themeProgress = useMemo(
    () =>
      themes.map(theme => {
        const criteria = criteriaList.filter(c => c.theme === theme);
        return {
          theme,
          evaluated: criteria.filter(c => progress[c.id]).length,
          total: criteria.length,
        };
      }),
    [themes, criteriaList, progress],
  );

  const counts = useMemo(() => {
    const tally = { conforme: 0, ecarts: 0, nonApplicable: 0 };
    for (const criterion of themeCriteria) {
      const status = progress[criterion.id]?.status;
      if (status === 'conforme' || status === 'default-compliant') tally.conforme += 1;
      else if (status === 'non-conforme' || status === 'project-implementation') tally.ecarts += 1;
      else if (status === 'non-applicable') tally.nonApplicable += 1;
    }
    return tally;
  }, [themeCriteria, progress]);

  const evaluated = counts.conforme + counts.ecarts + counts.nonApplicable;
  const expanded = expandedCriteriaId
    ? themeCriteria.find(c => c.id === expandedCriteriaId) ?? null
    : null;
  const expandedIndex = expanded ? themeCriteria.indexOf(expanded) : -1;

  const [selection, setSelection] = useState<Set<string>>(new Set());

  const handleSelectedChange = useCallback((criteriaId: string, selected: boolean) => {
    setSelection(previous => {
      const next = new Set(previous);
      if (selected) next.add(criteriaId);
      else next.delete(criteriaId);
      return next;
    });
  }, []);

  const applyToSelection = (status: CriteriaStatus | '') => {
    for (const criteriaId of selection) onStatusChange(criteriaId, status);
    setSelection(new Set());
  };

  // La case maîtresse n'agit que sur les critères affichés, filtres compris :
  // agir sur des critères hors écran, c'est ce qui rendait l'ancien « tout
  // sélectionner » malhonnête.
  const visibleIds = useMemo(() => filteredCriteria.map(c => c.id), [filteredCriteria]);
  const selectedVisibleCount = visibleIds.filter(id => selection.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  // `indeterminate` est une propriété du DOM, pas un attribut : React ne sait
  // pas la poser en JSX.
  const masterRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const toggleAllVisible = () => {
    setSelection(previous => {
      const next = new Set(previous);
      for (const id of visibleIds) {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const okColor = getStatusPresentation('conforme', audit.mode).color;
  const koColor = getStatusPresentation('non-conforme', audit.mode).color;
  const naColor = getStatusPresentation('non-applicable', audit.mode).color;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          levels={uniqueLevels}
          mode={audit.mode}
          inputRef={searchInputRef}
        />
        {toolbarActions}
      </div>

      <ThemeRail themes={themeProgress} activeTheme={activeTheme} onThemeChange={onThemeChange} />

      <div className="flex flex-wrap items-end gap-4 border-b border-separator pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-section font-semibold">{activeTheme}</h1>
          <p className="text-body text-ink-muted">
            {themeCriteria.length} critère{themeCriteria.length > 1 ? 's' : ''} dans ce thème
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-mono text-body font-semibold">
            {evaluated} / {themeCriteria.length} évalués
          </span>
          <SegmentedGauge
            className="w-[110px]"
            total={themeCriteria.length}
            segments={[
              { key: 'ok', count: counts.conforme, color: okColor },
              { key: 'ko', count: counts.ecarts, color: koColor },
              { key: 'na', count: counts.nonApplicable, color: naColor },
            ]}
            label={`${counts.conforme} conformes, ${counts.ecarts} non conformes, ${counts.nonApplicable} non applicables, ${themeCriteria.length - evaluated} à évaluer`}
          />
        </div>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onExpand(null)}
              className="target-44 flex h-ctrl items-center gap-2 rounded-ctrl border-1 border-border bg-surface px-3 text-body"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Retour à la liste
            </button>
            <h2 className="min-w-0 flex-1 truncate text-lead font-semibold">
              <span className="font-mono text-meta text-ink-muted">{expanded.id}</span>{' '}
              {cleanCriteriaTitle(expanded.title)}
            </h2>
          </div>

          <CriteriaDetail
            criterion={expanded}
            mode={audit.mode}
            currentStatus={progress[expanded.id]?.status}
            checkedTests={audit.checkedTests[expanded.id] ?? []}
            note={audit.notes[expanded.id] ?? ''}
            pages={audit.pages[expanded.id] ?? []}
            previous={expandedIndex > 0 ? themeCriteria[expandedIndex - 1] : undefined}
            next={
              expandedIndex < themeCriteria.length - 1
                ? themeCriteria[expandedIndex + 1]
                : undefined
            }
            onStatusChange={onStatusChange}
            onCheckedTestsChange={onCheckedTestsChange}
            onNoteChange={onNoteChange}
            onPagesChange={onPagesChange}
            onGlossaryClick={onGlossaryClick}
            onNavigate={onExpand}
          />
        </div>
      ) : (
        <>
          {filteredCriteria.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex h-touch w-touch flex-shrink-0 cursor-pointer items-center justify-center">
                <input
                  ref={masterRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label={`Sélectionner les ${filteredCriteria.length} critères affichés`}
                  className="h-icon-lg w-icon-lg cursor-pointer rounded-ctrl"
                />
              </label>
              <span className="text-dense text-ink-muted">
                {selectedVisibleCount > 0
                  ? `${selectedVisibleCount} sur ${filteredCriteria.length} sélectionné${selectedVisibleCount > 1 ? 's' : ''}`
                  : `Tout sélectionner (${filteredCriteria.length})`}
              </span>
            </div>
          )}

          <CriteriaList
          criteria={filteredCriteria}
          mode={audit.mode}
          progress={progress}
          onStatusChange={onStatusChange}
          onGlossaryClick={onGlossaryClick}
          onExpand={onExpand}
          selection={selection}
          onSelectedChange={handleSelectedChange}
          emptyState={
            <EmptyState
              title="Aucun critère ne correspond"
              body={
                filters.search
                  ? `« ${filters.search} » n'apparaît dans aucun intitulé de critère du thème ${activeTheme}. Essaie un autre thème, ou cherche ce terme dans le glossaire.`
                  : `Les filtres actifs excluent les ${themeCriteria.length} critères de ce thème.`
              }
              actions={
                <button
                  type="button"
                  onClick={() => onFiltersChange({ search: '', level: '', status: '' })}
                  className="target-44 h-ctrl rounded-ctrl border-1 border-border bg-surface px-3 text-body"
                >
                  Effacer les filtres
                </button>
              }
            />
          }
          />
        </>
      )}

      {!expanded && (
        <BulkActions
          selectedCount={selection.size}
          mode={audit.mode}
          onApply={status => applyToSelection(status)}
          onClearStatus={() => applyToSelection('')}
          onDeselectAll={() => setSelection(new Set())}
        />
      )}
    </div>
  );
}
