export interface Test {
  id: string;
  questions: string[];
}

export interface References {
  wcag?: string[];
  techniques?: string[];
}

/** Bloc de texte du RGAA : un paragraphe, ou une liste à puces. */
export type RichTextBlock = string | { ul: string[] };

export interface CriteriaRGAA {
  id: string;           // ex: "1.1"
  title: string;
  description?: string;
  url: string;          // lien vers le site officiel
  theme: string;        // ex: "Images"
  level: string;        // A, AA, AAA
  tests?: Test[];
  references?: References;
  technicalNote?: RichTextBlock[];
  particularCases?: RichTextBlock[];
}

export type Mode = 'classic' | 'design-system';

// Types pour les données JSON brutes
export interface GlossaryRawData {
  glossary: GlossaryTerm[];
}

export interface CriteriaRawData {
  wcag: { version: number };
  topics: Array<{
    topic: string;
    number: number;
    criteria: Array<{
      criterium: {
        number: number;
        title: string;
        tests?: { [key: string]: string[] | undefined };
        references?: Array<{
          wcag?: string[];
          techniques?: string[];
        }>;
        technicalNote?: RichTextBlock[];
        particularCases?: RichTextBlock[];
      };
    }>;
  }>;
}

export type ClassicStatus = 'conforme' | 'non-conforme' | 'non-applicable';
export type DesignSystemStatus = 'default-compliant' | 'project-implementation' | 'non-applicable';

export type CriteriaStatus = ClassicStatus | DesignSystemStatus;

export interface Progress {
  classic: {
    [criteriaId: string]: {
      status: ClassicStatus;
    }
  };
  designSystem: {
    [criteriaId: string]: {
      status: DesignSystemStatus;
    }
  };
}

/**
 * La progression d'un audit : un statut par critère évalué, à plat. Le mode de
 * l'audit dit lesquels des statuts sont possibles — c'est lui qu'on transporte à
 * côté, jamais un dictionnaire par mode dont un serait vide.
 *
 * `Progress`, au-dessus, ne sert plus qu'à la lecture de la v1, où une seule
 * progression anonyme portait les deux modes de front.
 */
export type AuditProgress = Progress['classic'] | Progress['designSystem'];

/** Un audit nommé, reprenable. Le mode est figé à la création. */
export interface Audit {
  id: string;
  name: string;
  scope?: string;
  mode: Mode;
  /** Thèmes retenus au périmètre ; [] signifie « tous ». */
  themes: string[];
  createdAt: string;
  updatedAt: string;
  progress: AuditProgress;
  /** criteriaId -> note d'audit */
  notes: Record<string, string>;
  /** criteriaId -> URLs concernées */
  pages: Record<string, string[]>;
  /** criteriaId -> ids des tests cochés */
  checkedTests: Record<string, string[]>;
  /** criteriaId -> provenance d'un statut posé par le scan automatique. */
  auto?: Record<string, AutoVerdict>;
}

export interface AuditStore {
  version: 2;
  audits: Audit[];
  activeAuditId: string | null;
}

/** Le thème n'est plus un filtre mais la navigation — voir ThemeRail. */
export interface CriteriaFilters {
  search: string;
  level: string;
  status: string;
}

export interface GlossaryTerm {
  title: string;
  body: string; // HTML content
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'export' | 'help';
  action: string;
}

/* --- Scan automatique : rapport importé et provenance ------------------- */

/** Ce qui a produit un verdict, dans la page réelle. */
export interface Evidence {
  url: string;
  selector?: string;
  snippet?: string;
}

export type ScanVerdict = 'fail' | 'na' | 'pass' | 'unknown';

/** Résultat du scan pour un critère, sur l'échantillon entier. */
export interface ScanOutcome {
  verdict: ScanVerdict;
  testVerdicts: Record<string, ScanVerdict>;
  evidence: Evidence[];
}

/**
 * Rapport produit par `pnpm scan`, tel qu'il arrive dans l'application.
 *
 * Un fichier vient du dehors : sa forme se valide à la frontière, dans
 * `utils/scanReport.ts`. Ce type décrit ce qui a passé la validation, jamais ce
 * qu'on a reçu.
 */
export interface ScanReport {
  schema: number;
  scannedAt: string;
  urls: string[];
  criteria: Record<string, ScanOutcome>;
}

/**
 * Provenance d'un statut posé par le scan.
 *
 * N'existe que tant que `progress[id]` porte la valeur posée par le scan : dès
 * que l'humain touche au statut, la provenance est supprimée. Sans cette règle,
 * le marqueur finirait par attribuer à la machine une décision prise à la main.
 */
export interface AutoVerdict {
  status: ClassicStatus;
  /** Tests RGAA qui ont tranché, ex. « 2.1.1 ». */
  testIds: string[];
  scannedAt: string;
  evidence: Evidence[];
}
