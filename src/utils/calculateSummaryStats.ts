import type { CriteriaRGAA, Progress, ClassicStatus, DesignSystemStatus } from '../types';

export interface ThemeStats {
  theme: string;
  conforme: number;
  nonConforme: number;
  nonApplicable: number;
  // Design System specific
  defaultCompliant: number;
  projectImplementation: number;
  total: number;
  rate: number | null;
}

export interface SummaryStats {
  globalRate: number | null;
  conforme: number;
  nonConforme: number;
  nonApplicable: number;
  notEvaluated: number;
  // Design System specific
  defaultCompliant: number;
  projectImplementation: number;
  total: number;
  byTheme: ThemeStats[];
}

export function calculateSummaryStats(
  criteriaList: CriteriaRGAA[],
  progress: Progress['classic'] | Progress['designSystem'],
  mode: 'classic' | 'design-system'
): SummaryStats {
  let conforme = 0;
  let nonConforme = 0;
  let nonApplicable = 0;
  let notEvaluated = 0;
  let defaultCompliant = 0;
  let projectImplementation = 0;

  // Map to track theme statistics
  const themeStats = new Map<string, ThemeStats>();

  for (const criteria of criteriaList) {
    const theme = criteria.theme;

    if (!themeStats.has(theme)) {
      themeStats.set(theme, {
        theme,
        conforme: 0,
        nonConforme: 0,
        nonApplicable: 0,
        defaultCompliant: 0,
        projectImplementation: 0,
        total: 0,
        rate: null,
      });
    }

    const themeData = themeStats.get(theme)!;
    themeData.total += 1;

    const status = progress[criteria.id as keyof typeof progress];

    if (!status) {
      notEvaluated += 1;
    } else {
      if (mode === 'classic') {
        const classicStatus = (status as { status: ClassicStatus }).status;
        if (classicStatus === 'conforme') {
          conforme += 1;
          themeData.conforme += 1;
        } else if (classicStatus === 'non-conforme') {
          nonConforme += 1;
          themeData.nonConforme += 1;
        } else if (classicStatus === 'non-applicable') {
          nonApplicable += 1;
          themeData.nonApplicable += 1;
        }
      } else {
        const dsStatus = (status as { status: DesignSystemStatus }).status;
        if (dsStatus === 'default-compliant') {
          defaultCompliant += 1;
          themeData.defaultCompliant += 1;
        } else if (dsStatus === 'project-implementation') {
          projectImplementation += 1;
          themeData.projectImplementation += 1;
        } else if (dsStatus === 'non-applicable') {
          nonApplicable += 1;
          themeData.nonApplicable += 1;
        }
      }
    }
  }

  // Calculate global rate
  let globalRate: number | null;
  if (mode === 'classic') {
    const globalDenominator = conforme + nonConforme;
    globalRate = globalDenominator === 0 ? null : (conforme / globalDenominator) * 100;
  } else {
    // DS coverage rate: compliant criteria / (total evaluated - non-applicable)
    const evaluated = criteriaList.length - notEvaluated;
    const dsDenominator = evaluated - nonApplicable;
    globalRate = dsDenominator === 0 ? null : ((defaultCompliant + projectImplementation) / dsDenominator) * 100;
  }

  // Calculate per-theme rates and build theme array maintaining order
  const byTheme: ThemeStats[] = [];
  const seenThemes = new Set<string>();

  for (const criteria of criteriaList) {
    if (!seenThemes.has(criteria.theme)) {
      seenThemes.add(criteria.theme);
      const themeData = themeStats.get(criteria.theme)!;
      let themeRate: number | null;
      if (mode === 'classic') {
        const themeDenominator = themeData.conforme + themeData.nonConforme;
        themeRate = themeDenominator === 0 ? null : (themeData.conforme / themeDenominator) * 100;
      } else {
        const themeEvaluated = themeData.defaultCompliant + themeData.projectImplementation + themeData.nonApplicable;
        const themeDsDenominator = themeEvaluated - themeData.nonApplicable;
        themeRate = themeDsDenominator === 0 ? null : ((themeData.defaultCompliant + themeData.projectImplementation) / themeDsDenominator) * 100;
      }
      byTheme.push({
        ...themeData,
        rate: themeRate,
      });
    }
  }

  return {
    globalRate,
    conforme,
    nonConforme,
    nonApplicable,
    notEvaluated,
    defaultCompliant,
    projectImplementation,
    total: criteriaList.length,
    byTheme,
  };
}
