/**
 * Utilitaires pour générer les liens vers les WCAG 2.1 en français et les techniques
 */

import wcagAnchors from '../data/wcag-anchors.json';

interface WcagMapping {
  [key: string]: string;
}

const anchors = wcagAnchors as WcagMapping;

/**
 * Extrait le numéro de critère depuis une référence WCAG
 * Exemple: "1.3.1 Non-text Content (A)" → "1.3.1"
 */
function extractCriteriaNumber(wcagRef: string): string | null {
  const match = wcagRef.match(/^(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

/**
 * Génère l'URL vers un critère WCAG 2.1 en français
 * @param wcagRef - Référence WCAG (ex: "1.3.1 Info and Relationships (A)")
 * @returns URL complète vers le critère en français
 */
export function getWcagCriteriaUrl(wcagRef: string): string {
  const criteriaNumber = extractCriteriaNumber(wcagRef);
  
  if (!criteriaNumber) {
    console.warn(`Impossible d'extraire le numéro de critère depuis: ${wcagRef}`);
    return '#';
  }
  
  // Chercher l'ancre correspondante dans le mapping
  const anchor = anchors[criteriaNumber];
  
  if (!anchor) {
    console.warn(`Ancre non trouvée pour le critère: ${criteriaNumber}`);
    return '#';
  }
  
  return `https://www.w3.org/Translations/WCAG21-fr/#${anchor}`;
}

/**
 * Détermine la catégorie de technique à partir de son code
 * @param techniqueCode - Code de la technique (ex: "G14", "H36", "ARIA4")
 */
function getTechniqueCategory(techniqueCode: string): string {
  // Format standard: lettre(s) + chiffres
  const match = techniqueCode.match(/^([A-Z]+)/);
  const prefix = match ? match[1].toUpperCase() : '';
  
  // Gérer les cas spéciaux comme ARIA, SVR, etc.
  if (prefix.startsWith('ARIA')) return 'aria';
  if (prefix.startsWith('SVR') || prefix.startsWith('SL')) return 'silverlight';
  if (prefix.startsWith('H')) return 'html';
  if (prefix.startsWith('C')) return 'css';
  if (prefix.startsWith('F')) return 'failures';
  if (prefix.startsWith('G')) return 'general';
  if (prefix.startsWith('T')) return 'text';
  
  // Par défaut, essayer avec "general"
  console.warn(`Catégorie inconnue pour la technique: ${techniqueCode}, utilisation de 'general'`);
  return 'general';
}

/**
 * Génère l'URL vers une technique WCAG
 * @param techniqueCode - Code de la technique (ex: "G14", "H36", "ARIA4")
 * @returns URL complète vers la technique
 */
export function getTechniqueUrl(techniqueCode: string): string {
  // Nettoyer le code (retirer les espaces, caractères spéciaux)
  const cleanCode = techniqueCode.trim().toUpperCase();
  
  if (!cleanCode) {
    console.warn(`Code de technique vide`);
    return '#';
  }
  
  const category = getTechniqueCategory(cleanCode);
  
  // Pour les techniques ARIA, il y a un format spécial
  if (cleanCode.startsWith('ARIA')) {
    return `https://www.w3.org/WAI/WCAG21/Techniques/aria/${cleanCode}`;
  }
  
  return `https://www.w3.org/WAI/WCAG21/Techniques/${category}/${cleanCode}`;
}

/**
 * Parse une référence WCAG pour extraire les informations
 * Exemple: "1.3.1 Info and Relationships (A)" → { number: "1.3.1", level: "A", fullText: "..." }
 */
export function parseWcagReference(wcagRef: string): {
  number: string;
  level: string;
  fullText: string;
} {
  const match = wcagRef.match(/^(\d+\.\d+\.\d+)\s+(.+?)\s+\(([A]{1,3})\)$/);
  
  if (match) {
    return {
      number: match[1],
      level: match[3],
      fullText: match[2],
    };
  }
  
  // Fallback si le format ne correspond pas
  return {
    number: extractCriteriaNumber(wcagRef) || '',
    level: '',
    fullText: wcagRef,
  };
}

