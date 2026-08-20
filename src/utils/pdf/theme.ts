import type { SummaryBucket } from '../summaryView';

/**
 * Les jetons de `src/tokens.css` en RGB, pour jsPDF.
 *
 * `StatusPresentation.color` vaut `var(--a-ok)` : une custom property, résolue
 * par le navigateur sur un élément du document. Un PDF n'a ni document ni
 * cascade, donc la valeur se recopie ici. Ces deux tables se relisent ensemble
 * quand la charte bouge — c'est le prix d'un rendu hors DOM.
 *
 * Thème clair uniquement : un rapport imprimé sur fond noir n'a pas de sens, et
 * le mode sombre de l'application ne concerne pas un document remis au client.
 */
export const PDF_RGB = {
  ink: [0, 0, 0],
  inkMuted: [64, 64, 64],
  surface: [255, 255, 255],
  sunk: [242, 242, 242],
  border: [201, 201, 201],
  track: [214, 214, 214],
  bannerTo: [46, 46, 46],
  bannerMuted: [196, 196, 196],
  ok: [15, 92, 55],
  okBg: [223, 240, 231],
  ko: [143, 29, 22],
  koBg: [247, 225, 223],
  na: [154, 154, 154],
  naBg: [232, 232, 232],
  todo: [64, 64, 64],
  todoBg: [237, 237, 237],
} as const satisfies Record<string, readonly [number, number, number]>;

export type Rgb = readonly [number, number, number];

/** Trait de jauge et de pastille, par seau de `toSummaryView`. */
export const BUCKET_RGB: Record<SummaryBucket['key'], Rgb> = {
  conforme: PDF_RGB.ok,
  ecarts: PDF_RGB.ko,
  nonApplicable: PDF_RGB.na,
  aEvaluer: PDF_RGB.track,
};

/** Fond de pastille, par seau. */
export const BUCKET_BG_RGB: Record<SummaryBucket['key'], Rgb> = {
  conforme: PDF_RGB.okBg,
  ecarts: PDF_RGB.koBg,
  nonApplicable: PDF_RGB.naBg,
  aEvaluer: PDF_RGB.todoBg,
};

/** A4 portrait, en millimètres. */
export const PDF_LAYOUT = {
  margin: 14,
  pageWidth: 210,
  pageHeight: 297,
  /** Au-delà, on passe à la page suivante. Laisse la place au pied de page. */
  bottomLimit: 268,
  contentWidth: 210 - 14 * 2,
  /** Hauteur du bandeau de la page de garde. */
  bannerHeight: 64,
  /** ≈ `--a-radius-ctrl`, ramené aux millimètres du document. */
  radiusCtrl: 3,
} as const;
