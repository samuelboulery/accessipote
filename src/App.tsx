import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Progress, CriteriaFilters, GlossaryTerm, ClassicStatus, CriteriaRawData } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { useFilters } from './hooks/useFilters';
import { useProgress } from './hooks/useProgress';
import { useDebounce } from './hooks/useDebounce';
import useToast from './hooks/useToast';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { LOCAL_STORAGE_KEY, DEFAULT_PANEL_WIDTH } from './constants';
import ModeSelector from './components/ModeSelector';
import SearchFilters from './components/SearchFilters';
import CriteriaList from './components/CriteriaList';
import ExportButton from './components/ExportButton';
import ProgressBar from './components/ProgressBar';
import GlossarySidePanel from './components/GlossarySidePanel';
import BulkActions from './components/BulkActions';
import Toast from './components/Toast';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import DarkModeToggle from './components/DarkModeToggle';
import SummaryTab from './components/SummaryTab';
import criteriaRawData from './data/criteria.json';
import glossaryRawData from './data/glossary.json';
import { transformCriteriaData } from './utils/transformCriteria';
import { BookOpen } from 'lucide-react';

function App() {
  const criteriaList = useMemo(() => {
    return transformCriteriaData(criteriaRawData as CriteriaRawData);
  }, []);

  // Charger le glossaire
  const glossary = useMemo(() => {
    return glossaryRawData.glossary as GlossaryTerm[];
  }, []);

  // Refs pour les raccourcis clavier
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exportMarkdownButtonRef = useRef<HTMLButtonElement>(null);

  // Toast notifications
  const { toasts, showToast, hideToast } = useToast();

  // Dark mode
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const [mode, setMode] = useState<'classic' | 'design-system'>('classic');
  const [activeTab, setActiveTab] = useState<'audit' | 'synthese'>('audit');

  interface OldProgressFormat {
    criteria: Record<string, { status: string }>;
  }

  const [progress, setProgress] = useLocalStorage<Progress>(LOCAL_STORAGE_KEY, {
    classic: {},
    designSystem: {},
  }, (oldValue: unknown): Progress => {
    // Migration des anciennes données vers le nouveau format
    if (oldValue && typeof oldValue === 'object' && 'criteria' in oldValue) {
      // Si on a l'ancien format avec 'criteria'
      const oldProgressValue = oldValue as OldProgressFormat;
      // Conversion des anciens statuts vers ClassicStatus
      const classicProgress: Progress['classic'] = {};
      for (const [key, value] of Object.entries(oldProgressValue.criteria)) {
        if (['conforme', 'non-conforme', 'non-applicable'].includes(value.status)) {
          classicProgress[key] = { status: value.status as ClassicStatus };
        }
      }
      return {
        classic: classicProgress,
        designSystem: {},
      };
    }
    return oldValue as Progress;
  });
  
  const [filters, setFilters] = useState<CriteriaFilters>({
    search: '',
    themes: [],
    level: '',
    status: '',
  });

  // Debouncer la recherche pour optimiser les performances
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Créer un objet de filtres avec la recherche debouncée (mémorisé)
  const debouncedFilters = useMemo(() => ({
    search: debouncedSearch,
    themes: filters.themes,
    level: filters.level,
    status: filters.status,
  }), [filters.themes, filters.level, filters.status, debouncedSearch]);

  // States pour le glossaire
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<string | undefined>();
  const [glossaryWidth, setGlossaryWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [targetCriteriaId, setTargetCriteriaId] = useState<string | null>(null);

  const handleGlossaryClick = useCallback((slug: string) => {
    setSelectedGlossaryTerm(slug);
    setGlossaryOpen(true);
  }, []);

  const handleCloseGlossary = useCallback(() => {
    setGlossaryOpen(false);
  }, []);

  const handleGlossaryToggle = useCallback(() => {
    setGlossaryOpen(prev => !prev);
  }, []);

  const { shortcuts, isHelpModalOpen, closeHelpModal } = useKeyboardShortcuts({
    searchInputRef,
    exportMarkdownButtonRef,
    onGlossaryToggle: handleGlossaryToggle,
  });

  const handleModeChange = useCallback((newMode: 'classic' | 'design-system') => {
    setMode(newMode);
  }, []);

  // Utiliser le hook useFilters pour la logique de filtrage
  const currentProgressForMode = useMemo(() => {
    return mode === 'classic' ? progress.classic : progress.designSystem;
  }, [progress, mode]);

  const {
    filteredCriteria,
    uniqueThemes,
    progressPercentage,
  } = useFilters(criteriaList, debouncedFilters, currentProgressForMode);

  // Utiliser le hook useProgress pour la gestion du progrès
  const {
    handleCriteriaStatusChange,
    handleSelectAll,
    handleDeselectAll,
    currentProgress,
  } = useProgress(progress, setProgress, mode, filteredCriteria);

  // Gérer le clic sur un critère depuis le glossaire
  const handleCriteriaClick = useCallback((criteriaId: string) => {
    // Trouver le critère dans la liste complète
    const criterion = criteriaList.find(c => c.id === criteriaId);
    if (!criterion) return;
    
    // Vérifier si le critère est dans la liste filtrée
    const isVisible = filteredCriteria.some(c => c.id === criteriaId);
    
    if (!isVisible) {
      // Le critère n'est pas visible, réinitialiser les filtres de thème
      setFilters(prev => ({
        ...prev,
        themes: [],
      }));
      // Sauvegarder l'ID pour le scroll différé
      setTargetCriteriaId(criteriaId);
    } else {
      // Le critère est visible, scroller immédiatement
      const element = document.getElementById(`criteria-${criteriaId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [criteriaList, filteredCriteria]);

  // Gérer le scroll différé vers un critère cible
  useEffect(() => {
    if (targetCriteriaId) {
      // Attendre que le DOM soit mis à jour
      setTimeout(() => {
        const element = document.getElementById(`criteria-${targetCriteriaId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTargetCriteriaId(null);
      }, 100);
    }
  }, [targetCriteriaId, filteredCriteria]);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <header className="mb-4 sm:mb-12 sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 py-4 sm:py-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-chelsea-market">
                  Accessipote
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base">
                  Ton meilleur pote pour vérifier la conformité aux critères d'accessibilité RGAA !
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
                <button
                  onClick={handleGlossaryToggle}
                  aria-keyshortcuts="g"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow font-medium"
                >
                  <BookOpen className="w-5 h-5" />
                  Glossaire
                </button>
              </div>
            </div>
          </header>

          <ModeSelector mode={mode} onModeChange={handleModeChange} />

          <ProgressBar progress={progressPercentage} />

          {/* Tab navigation */}
          <div
            role="tablist"
            aria-label="Navigation principale"
            className="flex gap-4 my-8 border-b border-gray-300 dark:border-gray-700"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setActiveTab('synthese');
              else if (e.key === 'ArrowLeft') setActiveTab('audit');
            }}
          >
            <button
              role="tab"
              id="tab-audit"
              aria-selected={activeTab === 'audit'}
              aria-controls="panel-audit"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'audit'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Audit
            </button>
            <button
              role="tab"
              id="tab-synthese"
              aria-selected={activeTab === 'synthese'}
              aria-controls="panel-synthese"
              onClick={() => setActiveTab('synthese')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'synthese'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Synthèse
            </button>
          </div>

          {/* Audit tab content */}
          {activeTab === 'audit' && (
            <div
              role="tabpanel"
              id="panel-audit"
              aria-labelledby="tab-audit"
              className="pb-20 sm:pb-0"
            >
              <SearchFilters
                filters={filters}
                onFiltersChange={setFilters}
                themes={uniqueThemes}
                mode={mode}
                inputRef={searchInputRef}
              />

              {filteredCriteria.length > 0 && (
                <BulkActions
                  mode={mode}
                  displayedCriteriaCount={filteredCriteria.length}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />
              )}

              <CriteriaList
                criteria={filteredCriteria}
                mode={mode}
                progress={currentProgress}
                onStatusChange={handleCriteriaStatusChange}
                onGlossaryClick={handleGlossaryClick}
              />

              <ExportButton
                mode={mode}
                progress={progress}
                criteriaList={criteriaList}
                onShowToast={showToast}
                exportMarkdownButtonRef={exportMarkdownButtonRef}
              />
            </div>
          )}

          {/* Synthèse tab content */}
          {activeTab === 'synthese' && (
            <div
              role="tabpanel"
              id="panel-synthese"
              aria-labelledby="tab-synthese"
            >
              <SummaryTab
                criteriaList={criteriaList}
                progress={progress}
                mode={mode}
                isDark={isDark}
              />
            </div>
          )}
        </div>
      </div>

      <GlossarySidePanel
        isOpen={glossaryOpen}
        onClose={handleCloseGlossary}
        selectedTerm={selectedGlossaryTerm}
        glossary={glossary}
        width={glossaryWidth}
        onWidthChange={setGlossaryWidth}
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
