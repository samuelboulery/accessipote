import { createElement } from 'react';
import DOMPurify from 'dompurify';
import { CRITERIA_ID_PATTERN } from '../constants';

interface ParseGlossaryHtmlOptions {
  onGlossaryClick?: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
}

/**
 * Configuration stricte de DOMPurify pour la sécurité
 */
const DOMPurifyConfig: any = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr'],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Whitelist d'attributs HTML autorisés pour la sécurité
 */
const ALLOWED_HTML_ATTRIBUTES = new Set([
  'class', 'id', 'title', 'lang', 'dir',
  'href', 'target', 'rel', 'aria-label', 'aria-labelledby',
  'role', 'tabindex', 'alt', 'src', 'width', 'height'
]);

/**
 * Parse le HTML du glossaire et transforme les liens en éléments React
 * @param html - Le HTML du terme de glossaire
 * @param options - Options de parsing (callbacks pour les différents types de liens)
 * @returns Des éléments React
 */
export function parseGlossaryHtml(
  html: string,
  options: ParseGlossaryHtmlOptions
): React.ReactNode[] {
  // Sanitizer le HTML
  const sanitizedHtml = DOMPurify.sanitize(html, DOMPurifyConfig) as unknown as string;
  
  // Créer un élément temporaire pour parser le HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizedHtml;
  
  // Fonction récursive pour transformer les nœuds DOM en éléments React
  const transformNode = (node: Node, key?: string): React.ReactNode => {
    // Texte
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    // Élément
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      const children = Array.from(element.childNodes).map((child, index) => 
        transformNode(child, `${key}-${index}`)
      );
      
      // Cas spécial pour les liens
      if (tagName === 'a') {
        const href = element.getAttribute('href') || '';
        
        // Lien interne (ancre) ou lien vers le site RGAA
        if (href.startsWith('#') || href.includes('accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#')) {
          let anchor = href.startsWith('#') ? href.slice(1) : '';
          
          // Extraire le critère depuis l'URL du site RGAA
          if (!anchor && href.includes('#') && href.includes('accessibilite.numerique.gouv.fr')) {
            const match = href.match(/#([\d.]+)/);
            if (match) {
              anchor = match[1];
            }
          }
          
          // C'est un lien vers un critère (format "1.1", "2.3", "12.10", etc.)
          if (anchor && CRITERIA_ID_PATTERN.test(anchor)) {
            return createElement(
              'button',
              {
                key: key,
                type: 'button',
                onClick: () => options.onCriteriaClick?.(anchor),
                className: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
              },
              ...children
            );
          } 
          // C'est un lien vers un terme du glossaire
          else if (anchor) {
            // L'ancre est déjà un slug correct qui correspond au titre normalisé
            return createElement(
              'button',
              {
                key: key,
                type: 'button',
                onClick: () => options.onGlossaryClick?.(anchor),
                className: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
              },
              ...children
            );
          }
        }
        // Lien externe
        else {
          // Valider que l'URL utilise un protocole sécurisé
          if (href.startsWith('http://') || href.startsWith('https://')) {
            return createElement(
              'a',
              {
                key: key,
                href: href,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'text-blue-600 hover:text-blue-800 underline',
              },
              ...children
            );
          }
        }
      }
      
      // Autres éléments HTML
      const props: any = { key: key };
      
      // Copier uniquement les attributs autorisés (whitelist pour sécurité)
      Array.from(element.attributes).forEach(attr => {
        if (ALLOWED_HTML_ATTRIBUTES.has(attr.name.toLowerCase())) {
          props[attr.name] = attr.value;
        }
      });
      
      return createElement(tagName, props, ...children);
    }
    
    return null;
  };
  
  return Array.from(tempDiv.childNodes).map((node, index) => 
    transformNode(node, `glossary-${index}`)
  );
}
