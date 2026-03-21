/**
 * Utilitaires pour générer les liens vers les WCAG 2.1 en français et les techniques
 */

import wcagAnchors from '../data/wcag-anchors.json';

interface WcagMapping {
  [key: string]: string;
}

const anchors = wcagAnchors as WcagMapping;

// Patterns regex
const CRITERIA_NUMBER_PATTERN = /^(\d+\.\d+\.\d+)/;
const WCAG_REFERENCE_PATTERN = /^(\d+\.\d+\.\d+)\s+(.+?)\s+\(([A]{1,3})\)$/;
const TECHNIQUE_PREFIX_PATTERN = /^([A-Z]+)/;

// URLs de base
const WCAG_BASE_URL = 'https://www.w3.org/Translations/WCAG21-fr/';
const TECHNIQUES_BASE_URL = 'https://www.w3.org/WAI/WCAG21/Techniques/';

/**
 * Valide une entrée string
 */
function isValidString(value: unknown): value is string {
  return value !== null && value !== undefined && typeof value === 'string';
}

/**
 * Extrait le numéro de critère depuis une référence WCAG
 * Exemple: "1.3.1 Non-text Content (A)" → "1.3.1"
 */
function extractCriteriaNumber(wcagRef: string | null | undefined): string | null {
  if (!isValidString(wcagRef)) {
    return null;
  }
  const match = wcagRef.match(CRITERIA_NUMBER_PATTERN);
  return match ? match[1] : null;
}

/**
 * Génère l'URL vers un critère WCAG 2.1 en français
 * @param wcagRef - Référence WCAG (ex: "1.3.1 Info and Relationships (A)")
 * @returns URL complète vers le critère en français
 */
export function getWcagCriteriaUrl(wcagRef: string | null | undefined): string {
  if (!isValidString(wcagRef)) {
    return '#';
  }

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

  return `${WCAG_BASE_URL}#${anchor}`;
}

/**
 * Détermine la catégorie de technique à partir de son code
 * @param techniqueCode - Code de la technique (ex: "G14", "H36", "ARIA4")
 */
function getTechniqueCategory(techniqueCode: string): string {
  // Format standard: lettre(s) + chiffres
  const match = techniqueCode.match(TECHNIQUE_PREFIX_PATTERN);
  const prefix = match ? match[1].toUpperCase() : '';

  // Mapping des préfixes aux catégories de techniques WCAG
  const categoryMap: Record<string, string> = {
    ARIA: 'aria',
    SVR: 'silverlight',
    SL: 'silverlight',
    H: 'html',
    C: 'css',
    F: 'failures',
    G: 'general',
    T: 'text',
  };

  // Chercher la catégorie en commençant par les préfixes plus longs
  for (const [key, category] of Object.entries(categoryMap)) {
    if (prefix.startsWith(key)) {
      return category;
    }
  }

  // Par défaut, essayer avec "general"
  console.warn(`Catégorie inconnue pour la technique: ${techniqueCode}, utilisation de 'general'`);
  return 'general';
}

/**
 * Génère l'URL vers une technique WCAG
 * @param techniqueCode - Code de la technique (ex: "G14", "H36", "ARIA4")
 * @returns URL complète vers la technique
 */
export function getTechniqueUrl(techniqueCode: string | null | undefined): string {
  if (!isValidString(techniqueCode)) {
    return '#';
  }

  // Nettoyer le code (retirer les espaces, caractères spéciaux)
  const cleanCode = techniqueCode.trim().toUpperCase();

  if (!cleanCode) {
    console.warn(`Code de technique vide`);
    return '#';
  }

  const category = getTechniqueCategory(cleanCode);

  // Pour les techniques ARIA, il y a un format spécial
  if (cleanCode.startsWith('ARIA')) {
    return `${TECHNIQUES_BASE_URL}aria/${cleanCode}`;
  }

  return `${TECHNIQUES_BASE_URL}${category}/${cleanCode}`;
}

/**
 * Parse une référence WCAG pour extraire les informations
 * Exemple: "1.3.1 Info and Relationships (A)" → { number: "1.3.1", level: "A", fullText: "..." }
 */
export function parseWcagReference(wcagRef: string | null | undefined): {
  number: string;
  level: string;
  fullText: string;
} {
  const emptyResult = { number: '', level: '', fullText: '' };

  if (!isValidString(wcagRef)) {
    return emptyResult;
  }

  const match = wcagRef.match(WCAG_REFERENCE_PATTERN);

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

