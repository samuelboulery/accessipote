/**
 * Types du moteur de scan automatique.
 *
 * Le moteur ne décide jamais seul d'un « conforme ». Voir `aggregate.ts` pour
 * la règle et la raison.
 */

/** Verdict d'un test RGAA, sur une page ou agrégé sur l'échantillon. */
export type TestVerdict = 'fail' | 'na' | 'pass' | 'unknown';

/**
 * Ce qui fonde un verdict — un axe séparé, et non un verdict de plus.
 *
 * `probable` dit « la machine penche par là sans le prouver ». Il se combine à
 * n'importe quel verdict : un échec soupçonné, un non applicable dont le
 * support n'apparaît peut-être qu'après un clic. Confondre les deux axes
 * proposerait un non applicable probable en non conforme.
 */
export type Certainty = 'proven' | 'probable';

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
  /**
   * Sélecteur CSS dont chaque élément trouvé est un *indice* d'échec.
   *
   * Là où `failWhen` désigne un contre-exemple certain, celui-ci désigne une
   * zone grise que la machine ne sait pas trancher — un `<svg>` sans rôle ni
   * nom accessible est soit une image porteuse sans alternative, soit une image
   * de décoration mal marquée. Les deux sont des défauts, mais pas le même.
   */
  probableWhen?: string;
  /**
   * Règles axe dont une violation est un indice, non une preuve.
   *
   * Pour les règles dont le périmètre déborde celui du test RGAA, ou dont le
   * référentiel prévoit des exceptions qu'axe ignore — le contraste d'un texte
   * purement décoratif, par exemple.
   */
  probableRules?: string[];
  /** Sélecteur CSS : absent de toutes les pages, le test est non applicable. */
  naWhen?: string;
  /**
   * Le support de `naWhen` peut n'apparaître qu'après une interaction.
   *
   * Mesuré sur Accessipote : zéro champ de formulaire au chargement, quatorze
   * après trois clics. Pour ces supports, l'absence ne prouve rien — le non
   * applicable reste `probable`, et attend l'auditeur.
   */
  volatileSupport?: true;
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
  /**
   * Sélecteur de la zone à sonder. Absent, la sonde regarde tout le document.
   *
   * Une zone introuvable ne renseigne rien : « pas vérifié » n'est pas « vide »,
   * et seul le second peut mener au non applicable.
   */
  root?: string;
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

/**
 * Ce qu'un cadre rapporte : le passage d'axe et celui de la sonde, réunis.
 *
 * Un cadre n'est pas une page. Ce qu'il porte est agrégé au niveau de la page
 * qui l'embarque, par `mergePageScan`.
 */
export interface FrameScan {
  violations: AxeRuleResult[];
  incomplete: AxeRuleResult[];
  passes: string[];
  present: Record<string, number>;
  found: Record<string, Array<{ selector: string; snippet: string }>>;
}

/** Ce qu'une page rapporte après le passage d'axe et des sélecteurs `naWhen`. */
export interface PageScan {
  url: string;
  violations: AxeRuleResult[];
  /**
   * Règles qu'axe n'a pas su trancher, avec leurs occurrences.
   *
   * Elles ne prouvent rien — c'est là que se logent les contrastes sur image de
   * fond, sur dégradé, sur opacité. Elles rendent le test suspect, et leurs
   * nœuds sont ce que l'auditeur ira regarder.
   */
  incomplete: AxeRuleResult[];
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
  certainty: Certainty;
  testVerdicts: Record<string, TestVerdict>;
  evidence: Evidence[];
}
