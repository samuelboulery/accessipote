import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Progress, CriteriaFilters, GlossaryTerm } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { useFilters } from './hooks/useFilters';
import { useProgress } from './hooks/useProgress';
import { useDebounce } from './hooks/useDebounce';
import { LOCAL_STORAGE_KEY, DEFAULT_PANEL_WIDTH } from './constants';
import ModeSelector from './components/ModeSelector';
import SearchFilters from './components/SearchFilters';
import CriteriaList from './components/CriteriaList';
import ExportButton from './components/ExportButton';
import ProgressBar from './components/ProgressBar';
import GlossarySidePanel from './components/GlossarySidePanel';
import BulkActions from './components/BulkActions';
import criteriaRawData from './data/criteria.json';
import glossaryRawData from './data/glossary.json';
import { transformCriteriaData } from './utils/transformCriteria';
import { BookOpen } from 'lucide-react';

function App() {
  const criteriaList = useMemo(() => {
    return transformCriteriaData(criteriaRawData);
  }, []);

  // Charger le glossaire
  const glossary = useMemo(() => {
    return glossaryRawData.glossary as GlossaryTerm[];
  }, []);

  
  const [mode, setMode] = useState<'classic' | 'design-system'>('classic');
  interface OldProgressFormat {
    criteria: Record<string, { status: string }>;
  }

  const [progress, setProgress] = useLocalStorage<Progress>(LOCAL_STORAGE_KEY, {
    classic: {},
    designSystem: {},
  }, (oldValue) => {
    // Migration des anciennes données vers le nouveau format
    if (oldValue && typeof oldValue === 'object' && 'criteria' in oldValue) {
      // Si on a l'ancien format avec 'criteria'
      const oldProgressValue = oldValue as OldProgressFormat;
      return {
        classic: oldProgressValue.criteria,
        designSystem: {},
      };
    }
    return oldValue;
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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <header className="mb-12">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Chelsea Market', cursive" }}>
                  Accessipote
                </h1>
                <p className="text-gray-600 text-base">
                  Ton meilleur pote pour vérifier la conformité aux critères d'accessibilité RGAA !
                </p>
              </div>
              <button
                onClick={() => setGlossaryOpen(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow font-medium"
              >
                <BookOpen className="w-5 h-5" />
                Glossaire
              </button>
            </div>
          </header>

          <ModeSelector mode={mode} onModeChange={handleModeChange} />
          
          <ProgressBar progress={progressPercentage} />

          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            themes={uniqueThemes}
            mode={mode}
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
        />
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
    </div>
  );
}

export default App;
