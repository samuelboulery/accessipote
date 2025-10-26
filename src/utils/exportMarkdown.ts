import type { CriteriaRGAA, ClassicStatus, Progress } from '../types';
import { cleanCriteriaTitle } from './stripMarkdown';

export function exportClassicMarkdown(progress: Progress['classic'], criteriaList: CriteriaRGAA[]): string {
  const lines: string[] = [];
  lines.push('# Rapport de Conformité RGAA - Accessipote\n');
  lines.push(`Date : ${new Date().toLocaleDateString('fr-FR')}\n`);

  const groupedCriteria = {
    conforme: [] as CriteriaRGAA[],
    'non-conforme': [] as CriteriaRGAA[],
    'non-applicable': [] as CriteriaRGAA[],
  };

  criteriaList.forEach(criteria => {
    const status = progress[criteria.id]?.status;
    if (status && groupedCriteria[status as ClassicStatus]) {
      groupedCriteria[status as ClassicStatus].push(criteria);
    }
  });

    // Section Conforme
    if (groupedCriteria.conforme.length > 0) {
      lines.push('## Critères Conformes\n');
      groupedCriteria.conforme.forEach(criteria => {
        const cleanTitle = cleanCriteriaTitle(criteria.title);
        lines.push(`### ${criteria.id} - ${cleanTitle}`);
        lines.push(`${criteria.description}\n`);
      });
    }

    // Section Non Conforme
    if (groupedCriteria['non-conforme'].length > 0) {
      lines.push('## Critères Non Conformes\n');
      groupedCriteria['non-conforme'].forEach(criteria => {
        const cleanTitle = cleanCriteriaTitle(criteria.title);
        lines.push(`### ${criteria.id} - ${cleanTitle}`);
        lines.push(`${criteria.description}\n`);
      });
    }

    // Section Non Applicable
    if (groupedCriteria['non-applicable'].length > 0) {
      lines.push('## Critères Non Applicables\n');
      groupedCriteria['non-applicable'].forEach(criteria => {
        const cleanTitle = cleanCriteriaTitle(criteria.title);
        lines.push(`### ${criteria.id} - ${cleanTitle}`);
        lines.push(`${criteria.description}\n`);
      });
    }

  return lines.join('\n');
}

export function exportDesignSystemMarkdown(progress: Progress['designSystem'], criteriaList: CriteriaRGAA[]): string {
  const lines: string[] = [];
  lines.push('# Checklist Design System - Conformité RGAA - Accessipote\n');
  lines.push(`Date : ${new Date().toLocaleDateString('fr-FR')}\n`);

  const defaultCompliant: CriteriaRGAA[] = [];
  const projectImplementation: CriteriaRGAA[] = [];

  criteriaList.forEach(criteria => {
    const status = progress[criteria.id]?.status;
    if (status === 'default-compliant') {
      defaultCompliant.push(criteria);
    } else if (status === 'project-implementation') {
      projectImplementation.push(criteria);
    }
  });

  // Tableau Conformité par défaut
    if (defaultCompliant.length > 0) {
      lines.push('## Conformes par défaut\n');
      lines.push('| Numéro | Titre |');
      lines.push('|--------|-------|');
      defaultCompliant.forEach(criteria => {
        const cleanTitle = cleanCriteriaTitle(criteria.title);
        lines.push(`| ${criteria.id} | ${cleanTitle} |`);
      });
      lines.push('');
    }

  // Tableau À mettre en place côté projet
    if (projectImplementation.length > 0) {
      lines.push('## À mettre en place côté projet\n');
      lines.push('| Numéro | Titre |');
      lines.push('|--------|-------|');
      projectImplementation.forEach(criteria => {
        const cleanTitle = cleanCriteriaTitle(criteria.title);
        lines.push(`| ${criteria.id} | ${cleanTitle} |`);
      });
    }

  return lines.join('\n');
}
