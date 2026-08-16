import type { AuditProgress, CriteriaRGAA, ClassicStatus } from '../types';
import { cleanCriteriaTitle } from './stripMarkdown';

function header(title: string): string[] {
  return [`# ${title}\n`, `Date : ${new Date().toLocaleDateString('fr-FR')}\n`];
}

function detailedSection(heading: string, criteria: CriteriaRGAA[]): string[] {
  if (criteria.length === 0) return [];
  return [
    `## ${heading}\n`,
    ...criteria.flatMap(c => [
      `### ${c.id} - ${cleanCriteriaTitle(c.title)}`,
      `${c.description}\n`,
    ]),
  ];
}

function tableSection(heading: string, criteria: CriteriaRGAA[]): string[] {
  if (criteria.length === 0) return [];
  return [
    `## ${heading}\n`,
    '| Numéro | Titre |',
    '|--------|-------|',
    ...criteria.map(c => `| ${c.id} | ${cleanCriteriaTitle(c.title)} |`),
  ];
}

export function exportClassicMarkdown(progress: AuditProgress, criteriaList: CriteriaRGAA[]): string {
  const grouped = {
    conforme: [] as CriteriaRGAA[],
    'non-conforme': [] as CriteriaRGAA[],
    'non-applicable': [] as CriteriaRGAA[],
  };

  criteriaList.forEach(criteria => {
    const status = progress[criteria.id]?.status;
    if (status && grouped[status as ClassicStatus]) {
      grouped[status as ClassicStatus].push(criteria);
    }
  });

  return [
    ...header('Rapport de Conformité RGAA - Accessipote'),
    ...detailedSection('Critères Conformes', grouped.conforme),
    ...detailedSection('Critères Non Conformes', grouped['non-conforme']),
    ...detailedSection('Critères Non Applicables', grouped['non-applicable']),
  ].join('\n');
}

export function exportDesignSystemMarkdown(progress: AuditProgress, criteriaList: CriteriaRGAA[]): string {
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

  return [
    ...header('Checklist Design System - Conformité RGAA - Accessipote'),
    ...tableSection('Conformes par défaut', defaultCompliant),
    // Ligne vide de séparation, émise dès que le premier tableau existe.
    ...(defaultCompliant.length > 0 ? [''] : []),
    ...tableSection('À mettre en place côté projet', projectImplementation),
  ].join('\n');
}
