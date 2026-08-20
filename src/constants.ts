/**
 * Constantes de l'application
 * Centralise les valeurs magiques, URLs et configurations
 */

// Clés de stockage
/** Progression v1, anonyme. Conservée en lecture seule : c'est le seul filet de
 *  sécurité d'un utilisateur qui aurait 106 critères de travail dedans. */
export const LOCAL_STORAGE_KEY = 'rgaa-progress';
/** Magasin v2 : audits nommés. */
export const AUDITS_STORAGE_KEY = 'rgaa-audits';

// PDF Export
export const PDF_Y_POS_LIMIT = 250;
export const PDF_START_Y_POS = 40;
export const PDF_HEADER_Y_POS = 20;

// Text limits
export const MAX_SEARCH_LENGTH = 200;

// Export filenames
export const PDF_FILENAME = 'rapport-rgaa.pdf';

// Regex patterns
export const CRITERIA_ID_PATTERN = /^\d+\.\d+$/;
export const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

// Toast notifications
export const TOAST_AUTO_DISMISS_MS = 3000;

/** Gabarits d'export Markdown, un par mode. Préférence utilisateur, pas donnée d'audit. */
export const EXPORT_TEMPLATES_STORAGE_KEY = 'rgaa-export-templates';
