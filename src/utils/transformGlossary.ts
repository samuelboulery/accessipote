import type { GlossaryTerm } from '../types';

/**
 * Convertit un titre en slug utilisable comme identifiant
 * Exemple: "Zone (d'une image réactive)" → "zone-d-une-image-reactive"
 */
export function titleToSlug(title: string): string {
  let result = title
    .toLowerCase()
    .normalize('NFD');
  
  // Remplacer les apostrophes typographiques par un espace AVANT de normaliser
  // Par exemple: "d'information" → "d information" → "d-information"
  result = result.replace(/['\u2018\u2019]/g, ' '); // Remplace les apostrophes par un espace
  
  // Enlever les accents (après avoir géré les apostrophes)
  result = result.replace(/[\u0300-\u036f]/g, ''); // Enlève les accents
  
  // Enlever les autres caractères spéciaux
  result = result.replace(/[^\w\s-]/g, ''); // Enlève les autres caractères spéciaux
  
  // Remplacer les espaces (y compris ceux créés par les apostrophes) par des tirets
  result = result.replace(/\s+/g, '-'); // Remplace les espaces par des tirets
  
  // Nettoyer les tirets multiples
  result = result.replace(/-+/g, '-'); // Remplace les tirets multiples par un seul
  
  // Enlever les tirets en début et fin
  result = result.replace(/^-|-$/g, ''); // Enlève les tirets en début et fin
  
  return result;
}

/**
 * Crée un mapping slug → GlossaryTerm pour accès rapide
 */
export function createGlossaryMap(glossary: GlossaryTerm[]): Map<string, GlossaryTerm> {
  const map = new Map<string, GlossaryTerm>();
  
  for (const term of glossary) {
    const slug = titleToSlug(term.title);
    map.set(slug, term);
  }
  
  return map;
}

/**
 * Trouve un terme du glossaire par son slug
 */
export function findGlossaryTermBySlug(slug: string, glossaryMap: Map<string, GlossaryTerm>): GlossaryTerm | undefined {
  return glossaryMap.get(slug);
}

/**
 * Trouve le slug d'un terme dans les ancres markdown
 * Exemple: "#zone-d-une-image-reactive" → "zone-d-une-image-reactive"
 */
export function extractSlugFromAnchor(anchor: string | undefined): string {
  if (!anchor) return '';
  // Enlève le # au début si présent
  return anchor.replace(/^#/, '');
}

