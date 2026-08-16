/**
 * Nettoie un titre de critère en supprimant le formatage markdown
 * Exemple: "[texte](url)" devient "texte"
 */
export function cleanCriteriaTitle(title: string): string {
  return title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}
