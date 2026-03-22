import type { CriteriaRGAA, Mode, CriteriaStatus } from '../types';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo, memo } from 'react';
import { parseMarkdownLinks } from '../utils/parseMarkdown';
import { parseInlineCode } from '../utils/parseInlineCode';
import { getWcagCriteriaUrl, getTechniqueUrl } from '../utils/generateWcagLinks';

interface CriteriaItemProps {
  criterion: CriteriaRGAA;
  mode: Mode;
  currentStatus?: CriteriaStatus;
  onStatusChange: (criteriaId: string, status: string) => void;
  onGlossaryClick: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
}

function CriteriaItem({
  criterion,
  mode,
  currentStatus,
  onStatusChange,
  onGlossaryClick,
  onCriteriaClick,
}: CriteriaItemProps) {
  const [showTests, setShowTests] = useState(false);
  const [showReferences, setShowReferences] = useState(false);

  // Mémoriser le parsing markdown pour éviter de recalculer à chaque render
  const parsedTitle = useMemo(
    () => parseMarkdownLinks(criterion.title, {
      onGlossaryClick,
      onCriteriaClick,
    }),
    [criterion.title, onGlossaryClick, onCriteriaClick]
  );

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm rounded-md">
              {criterion.id}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-200 font-medium text-xs rounded-md">
              {criterion.theme}
            </span>
            {currentStatus && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                currentStatus === 'conforme' || currentStatus === 'default-compliant'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                  : currentStatus === 'non-conforme'
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
                  : currentStatus === 'project-implementation'
                  ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {currentStatus === 'conforme' ? 'Conforme' :
                 currentStatus === 'non-conforme' ? 'Non conforme' :
                 currentStatus === 'non-applicable' ? 'Non applicable' :
                 currentStatus === 'default-compliant' ? 'Conforme par défaut' :
                 currentStatus === 'project-implementation' ? 'À mettre en place' :
                 currentStatus}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {parsedTitle}
          </h3>
          {criterion.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
              {parseInlineCode(criterion.description)}
            </p>
          )}
          <a
            href={criterion.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            Voir le critère sur le site officiel
            <ExternalLink className="w-4 h-4" />
          </a>
          
          {/* Tests */}
          {criterion.tests && criterion.tests.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowTests(!showTests)}
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {showTests ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Voir les tests ({criterion.tests.length})
              </button>
              {showTests && (
                <div className="mt-3 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                  {criterion.tests.map((test) => (
                    <div key={test.id} className="mb-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                        Test {test.id}:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {test.questions.map((question, index) => (
                          <li key={index} className="mb-1">
                            {parseMarkdownLinks(question, {
                              onGlossaryClick,
                              onCriteriaClick,
                            }).map((part, i) => {
                              // Si c'est un string, traiter les backticks
                              if (typeof part === 'string') {
                                return (
                                  <span key={i}>
                                    {parseInlineCode(part, 'px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-800')}
                                  </span>
                                );
                              }
                              // Sinon, retourner l'élément tel quel (pour les boutons de glossaire)
                              return part;
                            })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Références */}
          {criterion.references && (
            <div className="mt-4">
              <button
                onClick={() => setShowReferences(!showReferences)}
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {showReferences ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Références
              </button>
              {showReferences && (
                <div className="mt-3 pl-4 border-l-2 border-green-200 dark:border-green-800">
                  {criterion.references.wcag && criterion.references.wcag.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">WCAG:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {criterion.references.wcag.map((ref: string, index: number) => {
                          const url = getWcagCriteriaUrl(ref);
                          return (
                            <li key={index}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                              >
                                {ref}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {criterion.references.techniques && criterion.references.techniques.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Techniques:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {criterion.references.techniques.map((tech: string, index: number) => {
                          const url = getTechniqueUrl(tech);
                          return (
                            <li key={index}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                              >
                                {tech}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full md:flex-shrink-0 md:w-52 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-6">
          {mode === 'classic' ? (
            <div className="h-full flex flex-col justify-start gap-2">
              <label className={`flex items-center justify-start gap-3 px-4 py-6 rounded-lg cursor-pointer transition-all ${
                currentStatus === 'conforme'
                  ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-2 border-green-200 dark:border-green-700'
                  : 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-2 border-green-300/50 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-600'
              }`}>
                <input
                  type="radio"
                  name={`status-${criterion.id}`}
                  checked={currentStatus === 'conforme'}
                  onChange={() => onStatusChange(criterion.id, 'conforme')}
                  className="w-5 h-5 cursor-pointer dark:bg-green-700 dark:border-green-600"
                />
                <span className="text-sm font-semibold">Conforme</span>
              </label>
              <label className={`flex items-center justify-start gap-3 px-4 py-6 rounded-lg cursor-pointer transition-all ${
                currentStatus === 'non-conforme'
                  ? 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 border-2 border-red-200 dark:border-red-700'
                  : 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 border-2 border-red-300/50 dark:border-red-700/50 hover:border-red-400 dark:hover:border-red-600'
              }`}>
                <input
                  type="radio"
                  name={`status-${criterion.id}`}
                  checked={currentStatus === 'non-conforme'}
                  onChange={() => onStatusChange(criterion.id, 'non-conforme')}
                  className="w-5 h-5 cursor-pointer dark:bg-red-700 dark:border-red-600"
                />
                <span className="text-sm font-semibold">Non conforme</span>
              </label>
              <label className={`flex items-center justify-start gap-3 px-4 py-6 rounded-lg cursor-pointer transition-all ${
                currentStatus === 'non-applicable'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name={`status-${criterion.id}`}
                  checked={currentStatus === 'non-applicable'}
                  onChange={() => onStatusChange(criterion.id, 'non-applicable')}
                  className="w-5 h-5 cursor-pointer dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-semibold">Non applicable</span>
              </label>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-start gap-2">
              <label className={`flex items-center justify-start gap-3 px-4 py-6 rounded-lg cursor-pointer transition-all ${
                currentStatus === 'default-compliant'
                  ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-2 border-green-200 dark:border-green-700'
                  : 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-2 border-green-300/50 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-600'
              }`}>
                <input
                  type="radio"
                  name={`status-${criterion.id}`}
                  checked={currentStatus === 'default-compliant'}
                  onChange={() => onStatusChange(criterion.id, 'default-compliant')}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="text-sm font-semibold">Conforme par défaut</span>
              </label>
              <label className={`flex items-center justify-start gap-3 px-4 py-6 rounded-lg cursor-pointer transition-all ${
                currentStatus === 'project-implementation'
                  ? 'bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-200 border-2 border-amber-200 dark:border-amber-700'
                  : 'bg-amber-50 dark:bg-amber-900 text-amber-700 dark:text-amber-200 border-2 border-amber-300/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-600'
              }`}>
                <input
                  type="radio"
                  name={`status-${criterion.id}`}
                  checked={currentStatus === 'project-implementation'}
                  onChange={() => onStatusChange(criterion.id, 'project-implementation')}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="text-sm font-semibold">À mettre en place</span>
              </label>
              <label className={`flex items-center justify-start gap-3 px-4 py-6 rounded-lg cursor-pointer transition-all ${
                currentStatus === 'non-applicable'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name={`status-${criterion.id}`}
                  checked={currentStatus === 'non-applicable'}
                  onChange={() => onStatusChange(criterion.id, 'non-applicable')}
                  className="w-5 h-5 cursor-pointer dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-semibold">Non applicable</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mémoriser le composant pour éviter les re-renders inutiles
export default memo(CriteriaItem);
