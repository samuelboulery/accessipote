/**
 * Constantes de l'application
 * Centralise les valeurs magiques, URLs et configurations
 */

// URLs et clés
export const OFFICIAL_RGAA_URL = 'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#';
export const LOCAL_STORAGE_KEY = 'rgaa-progress';

// Panel dimensions
export const MIN_PANEL_WIDTH = 300;
export const MAX_PANEL_WIDTH = 800;
export const DEFAULT_PANEL_WIDTH = 400;
export const ANIMATION_DELAY_MS = 350;

// PDF Export
export const PDF_Y_POS_LIMIT = 250;
export const PDF_START_Y_POS = 40;
export const PDF_HEADER_Y_POS = 20;

// Text limits
export const MAX_SEARCH_LENGTH = 200;

// Export filenames
export const MARKDOWN_FILENAME_CLASSIC = 'rapport-rgaa.md';
export const MARKDOWN_FILENAME_DESIGN_SYSTEM = 'checklist-design-system.md';
export const PDF_FILENAME = 'rapport-rgaa.pdf';

// Regex patterns
export const CRITERIA_ID_PATTERN = /^\d+\.\d+$/;
export const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g;

