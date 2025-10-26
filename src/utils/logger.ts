/**
 * Logger utilitaire qui affiche les logs uniquement en mode développement
 * Évite d'exposer des informations sensibles en production
 */

/**
 * Log une erreur (uniquement en développement)
 */
export function logError(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
}

/**
 * Log un warning (uniquement en développement)
 */
export function logWarning(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}

/**
 * Log une information (uniquement en développement)
 */
export function logInfo(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}

