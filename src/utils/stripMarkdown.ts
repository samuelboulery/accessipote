/**
 * Utilitaires pour supprimer le formatage markdown des chaînes de caractères
 */

/**
 * Supprime les liens markdown d'un texte
 * Exemple: "[texte](url)" devient "texte"
 */
export function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/**
 * Nettoie un titre de critère en supprimant le formatage markdown
 */
export function cleanCriteriaTitle(title: string): string {
  return stripMarkdownLinks(title);
}

