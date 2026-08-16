export interface Test {
  id: string;
  questions: string[];
}

export interface References {
  wcag?: string[];
  techniques?: string[];
}

export interface CriteriaRGAA {
  id: string;           // ex: "1.1"
  title: string;
  description?: string;
  url: string;          // lien vers le site officiel
  theme: string;        // ex: "Images"
  level: string;        // A, AA, AAA
  tests?: Test[];
  references?: References;
  technicalNote?: string[];
  particularCases?: string[];
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
        technicalNote?: string[];
        particularCases?: (string | { ul: string[] })[];
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
