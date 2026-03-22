import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useIsMobile';
import { X, Search } from 'lucide-react';
import type { GlossaryTerm } from '../types';
import { titleToSlug } from '../utils/transformGlossary';
import { parseGlossaryHtml } from '../utils/parseGlossaryHtml';
import { ANIMATION_DELAY_MS, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH } from '../constants';

interface GlossarySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTerm?: string;
  glossary: GlossaryTerm[];
  width: number;
  onWidthChange: (width: number) => void;
  onGlossaryClick?: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
}

export default function GlossarySidePanel({
  isOpen,
  onClose,
  selectedTerm,
  glossary,
  width,
  onWidthChange,
  onGlossaryClick,
  onCriteriaClick,
}: GlossarySidePanelProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const selectedRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Filtrer les termes selon la recherche debouncée
  const filteredGlossary = glossary.filter((term) =>
    term.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  // Réinitialiser la recherche quand un terme est sélectionné
  useEffect(() => {
    if (selectedTerm && isOpen) {
      // Réinitialiser le filtre pour s'assurer que le terme est visible
      setSearchQuery('');
    }
  }, [selectedTerm, isOpen]);

  // Scroll vers le terme sélectionné quand il change
  useEffect(() => {
    if (selectedTerm && isOpen) {
      const element = document.getElementById(`term-${selectedTerm}`);
      if (element) {
        setTimeout(() => {
          // Obtenir le conteneur scrollable (celui avec overflow-y-auto)
          const scrollContainer = element.closest('[class*="overflow-y-auto"]');
          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            // Calculer la position pour mettre l'élément en haut de la zone visible
            const scrollTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top);
            scrollContainer.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          } else {
            // Fallback si pas de conteneur trouvé
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, ANIMATION_DELAY_MS);
      }
    }
  }, [selectedTerm, isOpen]);

  // Fermer avec Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Gérer le resize
  useEffect(() => {
    if (!isResizing) return;

    // Empêcher la sélection de texte pendant le drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault(); // Empêcher comportements par défaut
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Restaurer le comportement normal
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, onWidthChange]);

  return (
    <>
      {/* Backdrop mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}

      <div
        className={
          isMobile
            ? `fixed bottom-0 left-0 right-0 z-40 h-[80vh] rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`
            : `fixed right-0 top-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl flex-shrink-0 flex flex-col relative overflow-hidden transition-all duration-300 ease-in-out`
        }
        style={!isMobile ? { width: isOpen ? `${width}px` : '0px' } : undefined}
        role="complementary"
        aria-label="Glossaire RGAA"
      >
        {/* Indicateur drag mobile */}
        {isMobile && (
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        )}

        {/* Resize Handle (desktop uniquement) */}
        {!isMobile && isOpen && (
          <div
            ref={resizeHandleRef}
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 h-full w-2 cursor-col-resize hover:bg-gray-400 dark:hover:bg-gray-600 bg-transparent border-l-2 border-gray-400 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-600 z-10 transition-colors"
            style={{ touchAction: 'none' }}
          />
        )}

        {/* Overlay pendant le resize pour éviter les interactions */}
        {isResizing && (
          <div className="fixed inset-0 z-50 cursor-col-resize" />
        )}

        <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 id="glossary-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Glossaire RGAA
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Fermer le glossaire"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher dans le glossaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={200}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {filteredGlossary.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8 text-sm px-6">
                Aucun terme trouvé pour "{searchQuery}"
              </p>
            ) : (
              <div className="space-y-0">
                {filteredGlossary.map((term, index) => {
                  const termSlug = titleToSlug(term.title);
                  const isSelected = selectedTerm === termSlug;

                  return (
                    <div
                      key={index}
                      ref={isSelected ? selectedRef : null}
                      id={`term-${termSlug}`}
                      className={`
                        px-6 py-4 border-b border-gray-200 dark:border-gray-700
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-800'}
                      `}
                    >
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        {term.title}
                      </h3>
                      <div
                        className={`
                          prose prose-sm max-w-none dark:prose-invert
                          [&_p]:mb-3 [&_p:last-child]:mb-0
                          [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3
                          [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3
                          [&_li]:mb-1
                          [&_code]:bg-gray-100 dark:bg-gray-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-gray-800 dark:text-gray-200
                        `}
                      >
                        {parseGlossaryHtml(term.body, {
                          onGlossaryClick,
                          onCriteriaClick,
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

