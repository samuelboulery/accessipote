import { createElement } from 'react';
import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';
import { CRITERIA_ID_PATTERN } from '../constants';

interface ParseGlossaryHtmlOptions {
  onGlossaryClick?: (slug: string) => void;
  onCriteriaClick?: (criteriaId: string) => void;
}

/**
 * Les seuls attributs qui traversent l'assainissement. Une seule liste : elle
 * arme DOMPurify, puis la recopie vers React plus bas. Les tenir séparément
 * laissait la seconde déclarer dix attributs que la première effaçait déjà —
 * une permissivité de façade, impossible à relire.
 */
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'class', 'lang'];

/**
 * Configuration stricte de DOMPurify pour la sécurité
 */
const DOMPurifyConfig: Config = {
  // `span` et `lang` portent le balisage de langue des termes anglais du
  // glossaire officiel (RGAA 8.7). Les deux sont inertes : `span` n'a aucun
  // comportement, `lang` aucune valeur exécutable.
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr'],
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Seconde passe, sur le DOM reconstruit : même liste, défense en profondeur.
 */
const ALLOWED_HTML_ATTRIBUTES = new Set(ALLOWED_ATTR);

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
                className: 'cursor-pointer underline underline-offset-2',
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
                className: 'cursor-pointer underline underline-offset-2',
              },
              ...children
            );
          }
        }
        // Lien externe
        else if (href.startsWith('http://') || href.startsWith('https://')) {
          return createElement(
            'a',
            {
              key: key,
              href: href,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'underline underline-offset-2',
            },
            ...children
          );
        }

        // Tout le reste — `mailto:`, `tel:`, ancre vide, chemin relatif — rend
        // son texte, jamais un lien. Sans ce retour, l'exécution retombait sur
        // le code générique plus bas, qui recopie `href` depuis la whitelist
        // d'attributs sans repasser par le contrôle de protocole : le seul
        // garde-fou restant était DOMPurify.
        return createElement('span', { key: key }, ...children);
      }

      // Autres éléments HTML
      const props: Record<string, unknown> & { key?: string } = { key: key };
      
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
