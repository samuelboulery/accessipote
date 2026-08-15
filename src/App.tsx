import { useState, useMemo, useCallback, useRef } from 'react';
import type {
  CriteriaFilters,
  CriteriaStatus,
  CriteriaRawData,
  GlossaryTerm,
  Progress,
} from './types';
import { useAudits, type NewAuditInput } from './hooks/useAudits';
import { useDebounce } from './hooks/useDebounce';
import useToast from './hooks/useToast';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Sidebar, { type View } from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import NewAuditForm from './components/NewAuditForm';
import AuditScreen from './components/AuditScreen';
import SummaryTab from './components/SummaryTab';
import GlossarySidePanel from './components/GlossarySidePanel';
import ExportButton from './components/ExportButton';
import DarkModeToggle from './components/DarkModeToggle';
import Toast from './components/Toast';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import criteriaRawData from './data/criteria.json';
import glossaryRawData from './data/glossary.json';
import { transformCriteriaData } from './utils/transformCriteria';
import { DEFAULT_PANEL_WIDTH } from './constants';

function App() {
  const criteriaList = useMemo(
    () => transformCriteriaData(criteriaRawData as CriteriaRawData),
    [],
  );
  const glossary = useMemo(() => glossaryRawData.glossary as GlossaryTerm[], []);

  const themes = useMemo(
    () => [...new Set(criteriaList.map(c => c.theme))],
    [criteriaList],
  );
  const criteriaCountByTheme = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const criterion of criteriaList) {
      counts[criterion.theme] = (counts[criterion.theme] ?? 0) + 1;
    }
    return counts;
  }, [criteriaList]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportMarkdownButtonRef = useRef<HTMLButtonElement>(null);

  const { toasts, showToast, hideToast } = useToast();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { audits, activeAudit, createAudit, updateAudit, setActiveAuditId } = useAudits();

  const [view, setView] = useState<View>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTheme, setActiveTheme] = useState(themes[0]);
  const [expandedCriteriaId, setExpandedCriteriaId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CriteriaFilters>({ search: '', level: '', status: '' });

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<string | undefined>();

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedFilters = useMemo(
    () => ({ search: debouncedSearch, level: filters.level, status: filters.status }),
    [debouncedSearch, filters.level, filters.status],
  );

  const handleGlossaryClick = useCallback((slug: string) => {
    setSelectedGlossaryTerm(slug);
    setGlossaryOpen(true);
  }, []);

  const handleGlossaryToggle = useCallback(() => setGlossaryOpen(open => !open), []);

  const { shortcuts, isHelpModalOpen, closeHelpModal } = useKeyboardShortcuts({
    searchInputRef,
    exportMarkdownButtonRef,
    onGlossaryToggle: handleGlossaryToggle,
  });

  /**
   * Le glossaire renvoie vers un critère : basculer sur son thème puis lui donner
   * le focus. Sans virtualiseur, l'élément est présent dès le rendu suivant — plus
   * besoin de le poursuivre avec un setTimeout.
   */
  const handleCriteriaClick = useCallback(
    (criteriaId: string) => {
      const criterion = criteriaList.find(c => c.id === criteriaId);
      if (!criterion) return;

      setView('audit');
      setActiveTheme(criterion.theme);
      setExpandedCriteriaId(null);
      queueMicrotask(() => {
        document.getElementById(`criteria-${criteriaId}`)?.focus();
      });
    },
    [criteriaList],
  );

  const patchAudit = useCallback(
    (patch: Parameters<typeof updateAudit>[1]) => {
      if (activeAudit) updateAudit(activeAudit.id, patch);
    },
    [activeAudit, updateAudit],
  );

  const handleStatusChange = useCallback(
    (criteriaId: string, status: CriteriaStatus | '') => {
      if (!activeAudit) return;
      const next = { ...activeAudit.progress };
      if (status === '') delete next[criteriaId];
      else next[criteriaId] = { status } as (typeof next)[string];
      patchAudit({ progress: next });
    },
    [activeAudit, patchAudit],
  );

  const handleCheckedTestsChange = useCallback(
    (criteriaId: string, testIds: string[]) => {
      if (!activeAudit) return;
      patchAudit({ checkedTests: { ...activeAudit.checkedTests, [criteriaId]: testIds } });
    },
    [activeAudit, patchAudit],
  );

  const handleNoteChange = useCallback(
    (criteriaId: string, note: string) => {
      if (!activeAudit) return;
      patchAudit({ notes: { ...activeAudit.notes, [criteriaId]: note } });
    },
    [activeAudit, patchAudit],
  );

  const handlePagesChange = useCallback(
    (criteriaId: string, pages: string[]) => {
      if (!activeAudit) return;
      patchAudit({ pages: { ...activeAudit.pages, [criteriaId]: pages } });
    },
    [activeAudit, patchAudit],
  );

  const handleOpenAudit = useCallback(
    (auditId: string) => {
      setActiveAuditId(auditId);
      setExpandedCriteriaId(null);
      setView('audit');
    },
    [setActiveAuditId],
  );

  const handleCreateAudit = useCallback(
    (input: NewAuditInput) => {
      createAudit(input);
      setIsCreating(false);
      setActiveTheme(input.themes[0] ?? themes[0]);
      setExpandedCriteriaId(null);
      setView('audit');
      showToast(`Audit « ${input.name} » créé.`, 'success');
    },
    [createAudit, themes, showToast],
  );

  /** Les thèmes retenus au périmètre de l'audit ; [] signifie « tous ». */
  const auditThemes = useMemo(() => {
    if (!activeAudit || activeAudit.themes.length === 0) return themes;
    return themes.filter(theme => activeAudit.themes.includes(theme));
  }, [activeAudit, themes]);

  const auditCriteria = useMemo(
    () => criteriaList.filter(criterion => auditThemes.includes(criterion.theme)),
    [criteriaList, auditThemes],
  );

  const sidebarCounts = useMemo(() => {
    const tally = { conforme: 0, ecarts: 0, nonApplicable: 0, aEvaluer: 0 };
    for (const criterion of auditCriteria) {
      const status = activeAudit?.progress[criterion.id]?.status;
      if (status === 'conforme' || status === 'default-compliant') tally.conforme += 1;
      else if (status === 'non-conforme' || status === 'project-implementation') tally.ecarts += 1;
      else if (status === 'non-applicable') tally.nonApplicable += 1;
      else tally.aEvaluer += 1;
    }
    return tally;
  }, [auditCriteria, activeAudit]);

  const homeAudits = useMemo(
    () =>
      audits.map(audit => {
        const scoped =
          audit.themes.length === 0
            ? criteriaList
            : criteriaList.filter(c => audit.themes.includes(c.theme));
        return {
          audit,
          evaluated: scoped.filter(c => audit.progress[c.id]).length,
          total: scoped.length,
        };
      }),
    [audits, criteriaList],
  );

  /** `SummaryTab` et l'export attendent encore la forme v1, à deux modes. */
  const progressForMode = useMemo((): Progress => {
    if (!activeAudit) return { classic: {}, designSystem: {} };
    return activeAudit.mode === 'classic'
      ? { classic: activeAudit.progress as Progress['classic'], designSystem: {} }
      : { classic: {}, designSystem: activeAudit.progress as Progress['designSystem'] };
  }, [activeAudit]);

  const isThemeInAudit = auditThemes.includes(activeTheme);
  const currentTheme = isThemeInAudit ? activeTheme : auditThemes[0];

  const exportButton = activeAudit ? (
    <ExportButton
      mode={activeAudit.mode}
      progress={progressForMode}
      criteriaList={auditCriteria}
      onShowToast={showToast}
      exportMarkdownButtonRef={exportMarkdownButtonRef}
    />
  ) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        view={view}
        onNavigate={setView}
        activeAudit={activeAudit}
        counts={sidebarCounts}
        total={auditCriteria.length}
        onAuditSelectorClick={() => setView('home')}
      />

      <main className="my-2 flex-1 overflow-y-auto rounded-l-panel bg-surface p-4 shadow-panel">
        {view === 'home' &&
          (isCreating ? (
            <NewAuditForm
              themes={themes}
              criteriaCountByTheme={criteriaCountByTheme}
              onCancel={() => setIsCreating(false)}
              onSubmit={handleCreateAudit}
            />
          ) : (
            <HomeScreen
              audits={homeAudits}
              onOpenAudit={handleOpenAudit}
              onCreateAudit={() => setIsCreating(true)}
              onOpenGlossary={() => setGlossaryOpen(true)}
            />
          ))}

        {view === 'audit' &&
          (activeAudit ? (
            <AuditScreen
              audit={activeAudit}
              criteriaList={auditCriteria}
              themes={auditThemes}
              activeTheme={currentTheme}
              onThemeChange={theme => {
                setActiveTheme(theme);
                setExpandedCriteriaId(null);
              }}
              filters={debouncedFilters}
              onFiltersChange={setFilters}
              expandedCriteriaId={expandedCriteriaId}
              onExpand={setExpandedCriteriaId}
              onStatusChange={handleStatusChange}
              onCheckedTestsChange={handleCheckedTestsChange}
              onNoteChange={handleNoteChange}
              onPagesChange={handlePagesChange}
              onGlossaryClick={handleGlossaryClick}
              searchInputRef={searchInputRef}
              toolbarActions={
                <>
                  <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
                  {exportButton}
                </>
              }
            />
          ) : (
            <p className="text-body text-ink-muted">
              Aucun audit ouvert. Reprenez-en un depuis l'accueil ou démarrez-en un nouveau.
            </p>
          ))}

        {view === 'summary' && activeAudit && (
          <SummaryTab
            criteriaList={auditCriteria}
            progress={progressForMode}
            mode={activeAudit.mode}
            isDark={isDark}
          />
        )}

        {view === 'glossary' && (
          <p className="text-body text-ink-muted">
            Le glossaire s'ouvre en panneau. Utilisez la touche G ou un terme souligné dans un
            critère.
          </p>
        )}
      </main>

      <GlossarySidePanel
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        selectedTerm={selectedGlossaryTerm}
        glossary={glossary}
        width={DEFAULT_PANEL_WIDTH}
        onWidthChange={() => {}}
        onGlossaryClick={handleGlossaryClick}
        onCriteriaClick={handleCriteriaClick}
      />

      <Toast toasts={toasts} onDismiss={hideToast} />

      <KeyboardShortcutsModal
        isOpen={isHelpModalOpen}
        shortcuts={shortcuts}
        onClose={closeHelpModal}
      />
    </div>
  );
}

export default App;
