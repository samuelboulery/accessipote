import { useEffect, useRef, useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const selectedRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Filtrer les termes selon la recherche
  const filteredGlossary = glossary.filter((term) =>
    term.title.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div
      className={`
        fixed right-0 top-0 bottom-0 bg-white shadow-2xl
        flex-shrink-0 flex flex-col relative
        transition-all duration-300 ease-in-out
        overflow-hidden
      `}
      style={{ width: isOpen ? `${width}px` : '0px' }}
      role="complementary"
      aria-label="Glossaire RGAA"
    >
        {/* Resize Handle */}
        {isOpen && (
          <div
            ref={resizeHandleRef}
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 h-full w-2 cursor-col-resize hover:bg-black bg-transparent border-l-2 border-black hover:border-black z-10 transition-colors"
            style={{ touchAction: 'none' }}
          />
        )}

        {/* Overlay pendant le resize pour éviter les interactions */}
        {isResizing && (
          <div className="fixed inset-0 z-50 cursor-col-resize" />
        )}

        <div className="flex flex-col h-full border-l border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <h2 id="glossary-title" className="text-lg font-semibold text-gray-900">
              Glossaire RGAA
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Fermer le glossaire"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans le glossaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={200}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {filteredGlossary.length === 0 ? (
              <p className="text-gray-600 text-center py-8 text-sm px-6">
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
                        px-6 py-4 border-b border-gray-200
                        ${isSelected ? 'bg-blue-50' : 'bg-white'}
                      `}
                    >
                      <h3 className="text-base font-semibold text-gray-900 mb-3">
                        {term.title}
                      </h3>
                      <div
                        className={`
                          prose prose-sm max-w-none
                          [&_p]:mb-3 [&_p:last-child]:mb-0
                          [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3
                          [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3
                          [&_li]:mb-1
                          [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-gray-800
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
  );
}

