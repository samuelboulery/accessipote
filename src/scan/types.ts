/**
 * Types du moteur de scan automatique.
 *
 * Le moteur ne décide jamais seul d'un « conforme ». Voir `aggregate.ts` pour
 * la règle et la raison.
 */

/** Verdict d'un test RGAA, sur une page ou agrégé sur l'échantillon. */
export type TestVerdict = 'fail' | 'na' | 'pass' | 'unknown';

/** De quoi retrouver ce qui a produit un verdict, dans la page réelle. */
export interface Evidence {
  url: string;
  selector?: string;
  snippet?: string;
}

/**
 * Correspondance entre un test RGAA et ce qui permet de le trancher.
 *
 * Écrite à la main, un test à la fois : axe-core mappe ses règles vers WCAG,
 * pas vers le RGAA, et la correspondance n'est pas 1-pour-1.
 */
export interface RgaaMapping {
  /** Identifiant du test RGAA, ex. « 2.1.1 ». */
  testId: string;
  /** Critère auquel ce test appartient, ex. « 2.1 ». */
  criterionId: string;
  /** Règles axe dont une violation prouve l'échec du test. */
  axeRules?: string[];
  /**
   * Sélecteur CSS dont chaque élément trouvé est un contre-exemple.
   *
   * Indispensable là où le RGAA est plus littéral qu'axe. Le test 2.1.1 exige
   * un attribut `title` sur le cadre ; la règle `frame-title` d'axe se contente
   * d'un nom accessible, et laisse donc passer un `aria-label` que le RGAA
   * refuse.
   */
  failWhen?: string;
  /** Sélecteur CSS : absent de toutes les pages, le test est non applicable. */
  naWhen?: string;
  /**
   * Restreint le test au document principal.
   *
   * Les critères « dans chaque page web » — langue par défaut, titre de page —
   * portent sur la page auditée, pas sur les documents qu'elle embarque. Sans
   * cette restriction, un `<iframe>` sans titre ferait échouer le critère 8.5
   * d'une page qui a pourtant le sien.
   */
  mainFrameOnly?: boolean;
  /**
   * `true` seulement pour les tests de présence ou de format pure, où
   * l'absence de contre-exemple vaut réellement preuve. Jamais pour un test
   * de pertinence.
   */
  provesPass: boolean;
}

/**
 * Ce que la sonde doit chercher dans un document.
 *
 * Un seul argument sérialisable : c'est tout ce qu'un `evaluate` ou un
 * `executeScript` sait transmettre à la fonction qu'il injecte.
 */
export interface ProbeOptions {
  /** Sélecteurs de support, à compter. */
  naSelectors: string[];
  /** Sélecteurs de contre-exemple, à récolter. */
  failSelectors: string[];
  /** Longueur maximale d'un extrait — le rapport finit dans localStorage. */
  snippetMax: number;
  /** Nombre maximal de contre-exemples retenus par sélecteur. */
  nodesPerSelector: number;
}

/** Ce que la sonde rapporte d'un document. Un sélecteur absent n'a pas été évalué. */
export interface ProbeResult {
  present: Record<string, number>;
  found: Record<string, Array<{ selector: string; snippet: string }>>;
}

/** Une règle axe en violation sur une page, avec ses occurrences. */
export interface AxeRuleResult {
  id: string;
  nodes: Array<{ selector: string; snippet: string }>;
}

/** Ce qu'une page rapporte après le passage d'axe et des sélecteurs `naWhen`. */
export interface PageScan {
  url: string;
  violations: AxeRuleResult[];
  /** Ids des règles qu'axe n'a pas su trancher. Ne prouvent rien. */
  incomplete: string[];
  /** Ids des règles passées sur cette page. */
  passes: string[];
  /** Sélecteur `naWhen` → nombre d'éléments trouvés sur cette page. */
  present: Record<string, number>;
  /** Sélecteur `failWhen` → contre-exemples trouvés sur cette page. */
  found: Record<string, Array<{ selector: string; snippet: string }>>;
}

/** Résultat agrégé pour un critère, sur l'ensemble de l'échantillon. */
export interface CriterionOutcome {
  verdict: TestVerdict;
  testVerdicts: Record<string, TestVerdict>;
  evidence: Evidence[];
}
