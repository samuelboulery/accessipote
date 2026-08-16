import { useState, useMemo, useCallback, useRef } from 'react';
import type {
  CriteriaFilters,
  CriteriaStatus,
  CriteriaRawData,
  GlossaryTerm,
} from './types';
import { useAudits, type NewAuditInput } from './hooks/useAudits';
import { useDebounce } from './hooks/useDebounce';
import useToast from './hooks/useToast';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useIsMobile } from './hooks/useIsMobile';
import Sidebar, { type View } from './components/Sidebar';
import MobileTabBar from './components/MobileTabBar';
import MobileTopBar from './components/MobileTopBar';
import NoAuditState from './components/NoAuditState';
import HomeScreen from './components/HomeScreen';
import HomeHero from './components/HomeHero';
import NewAuditForm from './components/NewAuditForm';
import AuditScreen from './components/AuditScreen';
import SummaryTab from './components/SummaryTab';
import GlossaryScreen from './components/GlossaryScreen';
import GlossaryPopover from './components/GlossaryPopover';
import ExportButton from './components/ExportButton';
import Toast from './components/Toast';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import criteriaRawData from './data/criteria.json';
import glossaryRawData from './data/glossary.json';
import { transformCriteriaData } from './utils/transformCriteria';
import { titleToSlug } from './utils/transformGlossary';

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
  const { mode: themeMode, cycle: cycleTheme } = useDarkMode();
  const isMobile = useIsMobile();
  const { audits, activeAudit, createAudit, updateAudit, deleteAudit, setActiveAuditId } =
    useAudits();

  const [view, setView] = useState<View>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTheme, setActiveTheme] = useState(themes[0]);
  const [expandedCriteriaId, setExpandedCriteriaId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CriteriaFilters>({ search: '', level: '', status: '' });

  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<string | undefined>();
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedFilters = useMemo(
    () => ({ search: debouncedSearch, level: filters.level, status: filters.status }),
    [debouncedSearch, filters.level, filters.status],
  );

  /**
   * Le terme cliqué a le focus au moment du clic : c'est ainsi qu'on récupère
   * son rectangle sans avoir à faire descendre l'événement dans parseMarkdown.
   */
  const handleGlossaryClick = useCallback((slug: string) => {
    const trigger = document.activeElement;
    setSelectedGlossaryTerm(slug);
    setPopoverAnchor(trigger instanceof HTMLElement ? trigger.getBoundingClientRect() : null);
  }, []);

  const handleGlossaryToggle = useCallback(() => {
    setPopoverAnchor(null);
    setView(current => (current === 'glossary' ? 'audit' : 'glossary'));
  }, []);

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
      setPopoverAnchor(null);
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

  const handleDeleteAudit = useCallback(
    (auditId: string) => {
      const removed = audits.find(audit => audit.id === auditId);
      deleteAudit(auditId);
      if (removed) showToast(`Audit « ${removed.name} » supprimé.`, 'info');
    },
    [audits, deleteAudit, showToast],
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

  const popoverTerm = useMemo(
    () =>
      selectedGlossaryTerm
        ? glossary.find(term => titleToSlug(term.title) === selectedGlossaryTerm) ?? null
        : null,
    [glossary, selectedGlossaryTerm],
  );

  const isThemeInAudit = auditThemes.includes(activeTheme);
  const currentTheme = isThemeInAudit ? activeTheme : auditThemes[0];

  const exportButton = activeAudit ? (
    <ExportButton
      mode={activeAudit.mode}
      progress={activeAudit.progress}
      criteriaList={auditCriteria}
      onShowToast={showToast}
      exportMarkdownButtonRef={exportMarkdownButtonRef}
    />
  ) : null;

  // Le formulaire de création vit sur l'accueil : y appeler depuis une autre vue
  // demande les deux gestes, jamais un seul.
  const startNewAudit = () => {
    setView('home');
    setIsCreating(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {!isMobile && (
        <Sidebar
          view={view}
          onNavigate={setView}
          activeAudit={activeAudit}
          counts={sidebarCounts}
          total={auditCriteria.length}
          audits={homeAudits}
          onSelectAudit={handleOpenAudit}
          onCreateAudit={startNewAudit}
          themeMode={themeMode}
          onCycleTheme={cycleTheme}
        />
      )}

      {/* Le défilement change d'étage selon la taille. En desktop c'est le
          panneau qui défile, la bannière restant posée au-dessus. En mobile il
          remonte d'un cran, sur ce conteneur : sans quoi la bannière reste figée
          et mange la moitié de l'écran pendant qu'on parcourt la liste. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto sm:overflow-hidden">
        {isMobile && <MobileTopBar themeMode={themeMode} onCycleTheme={cycleTheme} />}

        {view === 'home' && !isCreating && (
          <HomeHero
            criteriaCount={criteriaList.length}
            themeCount={themes.length}
            glossaryCount={glossary.length}
          />
        )}

        <main
          className={[
            'flex flex-1 flex-col bg-surface p-6 sm:overflow-y-auto',
            // La barre d'onglets fait 64px plus la zone sûre ; les 16 de plus
            // sont l'air qui manquait sous le dernier bouton.
            isMobile
              ? 'pb-[calc(80px+env(safe-area-inset-bottom))]'
              : 'my-2 rounded-l-card shadow-panel',
          ].join(' ')}
        >
        {/* Le panneau garde son bord droit à fleur — c'est lui qui porte la
            forme. La largeur de lecture se borne à l'intérieur, avec le même
            conteneur que la bannière, qui vit hors du panneau : c'est ce qui
            tient les deux blocs de texte alignés. */}
        <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col">
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
              criteriaCount={criteriaList.length}
              onOpenAudit={handleOpenAudit}
              onCreateAudit={() => setIsCreating(true)}
              onDeleteAudit={handleDeleteAudit}
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
              toolbarActions={exportButton}
            />
          ) : (
            <NoAuditState
              target="audit"
              hasAudits={homeAudits.length > 0}
              onGoHome={() => setView('home')}
              onCreateAudit={startNewAudit}
            />
          ))}

        {view === 'summary' &&
          (activeAudit ? (
            <SummaryTab
              criteriaList={auditCriteria}
              progress={activeAudit.progress}
              mode={activeAudit.mode}
              actions={exportButton}
            />
          ) : (
            <NoAuditState
              target="summary"
              hasAudits={homeAudits.length > 0}
              onGoHome={() => setView('home')}
              onCreateAudit={startNewAudit}
            />
          ))}

        {view === 'glossary' && (
          <GlossaryScreen
            glossary={glossary}
            criteriaList={criteriaList}
            selectedSlug={selectedGlossaryTerm}
            onSelectTerm={setSelectedGlossaryTerm}
            onCriteriaClick={handleCriteriaClick}
          />
        )}
        </div>
        </main>
      </div>

      {popoverTerm && popoverAnchor && (
        <GlossaryPopover
          term={popoverTerm}
          anchor={popoverAnchor}
          onClose={() => setPopoverAnchor(null)}
          onOpenInGlossary={() => {
            setPopoverAnchor(null);
            setView('glossary');
          }}
        />
      )}

      {isMobile && <MobileTabBar view={view} onNavigate={setView} />}

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
