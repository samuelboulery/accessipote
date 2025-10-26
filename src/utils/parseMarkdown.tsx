import { createElement } from 'react';
import { extractSlugFromAnchor } from './transformGlossary';
import { MARKDOWN_LINK_PATTERN } from '../constants';
import { CRITERIA_ID_PATTERN } from '../constants';

interface ParseMarkdownLinksOptions {
  onGlossaryClick: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
}

// Compiler la regex une seule fois au niveau module pour optimiser les performances
const MARKDOWN_LINK_REGEX = new RegExp(MARKDOWN_LINK_PATTERN);

/**
 * Parse les liens markdown dans un texte et les transforme en éléments React cliquables
 * @param text - Le texte contenant des liens markdown
 * @param options - Options de parsing (callbacks pour les différents types de liens)
 * @returns Un tableau d'éléments React
 */
export function parseMarkdownLinks(
  text: string,
  options: ParseMarkdownLinksOptions
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
    const [, linkText, linkTarget] = match;
    const matchIndex = match.index;
    
    // Ajouter le texte avant le lien
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }
    
    // Extraire le slug de l'ancre (vérifier que linkTarget existe)
    const slug = extractSlugFromAnchor(linkTarget || '');
    
    // Détecter si c'est un lien vers un critère (format "1.1", "2.3", etc.)
    const isCriteriaLink = CRITERIA_ID_PATTERN.test(slug);
    
    if (isCriteriaLink && options.onCriteriaClick) {
      // Lien vers un critère dans l'app
      parts.push(
        createElement(
          'button',
          {
            key: matchIndex,
            type: 'button',
            onClick: () => options.onCriteriaClick!(slug),
            'aria-label': `Voir le critère ${slug}`,
            className: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
          },
          linkText
        )
      );
    } else {
      // Lien vers le glossaire (par défaut)
      parts.push(
        createElement(
          'button',
          {
            key: matchIndex,
            type: 'button',
            onClick: () => options.onGlossaryClick(slug),
            'aria-label': `Voir la définition de ${linkText} dans le glossaire`,
            className: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
          },
          linkText
        )
      );
    }
    
    lastIndex = MARKDOWN_LINK_REGEX.lastIndex;
  }
  
  // Ajouter le texte restant
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // Si aucun lien trouvé, retourner le texte original
  if (parts.length === 0) {
    return [text];
  }
  
  return parts;
}

