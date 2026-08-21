import type { Audit, CriteriaRGAA, CriteriaStatus, Mode } from '../types';
import { calculateSummaryStats } from './calculateSummaryStats';
import { toSummaryView } from './summaryView';
import { getStatusPresentation } from './statusPresentation';
import { cleanCriteriaTitle } from './stripMarkdown';

/**
 * Un gabarit d'export Markdown, rendu à l'exécution.
 *
 * La grammaire tient en deux formes — `{{jeton}}` et
 * `{{#critères[:seau]}}…{{/critères}}` — et le moteur en trente lignes. Une
 * dépendance de templating (Mustache, Handlebars) apporterait des sections
 * inversées, des partials et une échappement HTML dont un fichier `.md` n'a
 * aucun usage.
 *
 * Les filtres nomment les seaux de `toSummaryView` (`ok`, `ecarts`, `na`,
 * `aEvaluer`) et non les statuts stockés : un gabarit écrit sur un audit
 * classique rend tel quel sur un audit design system, où les mêmes seaux
 * portent d'autres libellés.
 */

export interface TemplateData {
  audit: Audit;
  criteria: CriteriaRGAA[];
}

/** Au-delà, ce n'est plus un gabarit mais un rapport collé dans le champ. */
export const TEMPLATE_MAX_LENGTH = 20_000;

type Bucket = 'ok' | 'ecarts' | 'na' | 'aEvaluer';

const BLOCK_PATTERN = /\{\{#critères(?::([a-zA-Z]+))?\}\}([\s\S]*?)\{\{\/critères\}\}/g;
const TOKEN_PATTERN = /\{\{([^{}#/][^{}]*)\}\}/g;

function bucketOf(status: CriteriaStatus | undefined): Bucket {
  if (status === 'conforme' || status === 'default-compliant') return 'ok';
  if (status === 'non-conforme' || status === 'project-implementation') return 'ecarts';
  if (status === 'non-applicable') return 'na';
  return 'aEvaluer';
}

function modeLabel(mode: Mode): string {
  return mode === 'classic' ? 'Classic' : 'Design System';
}

/** « scan automatique du 20/08/2026 (tests 1.1.1) » — vide si l'humain a tranché. */
function provenanceOf(audit: Audit, criteriaId: string): string {
  const auto = audit.auto?.[criteriaId];
  if (!auto) return '';
  const date = new Date(auto.scannedAt).toLocaleDateString('fr-FR');
  const tests = auto.testIds.length > 0 ? ` (tests ${auto.testIds.join(', ')})` : '';
  return `scan automatique du ${date}${tests}`;
}

function statusOf(audit: Audit, criteriaId: string): CriteriaStatus | undefined {
  return audit.progress[criteriaId as keyof typeof audit.progress]?.status;
}

/** Remplace les jetons connus ; laisse les autres visibles pour que l'auteur du gabarit voie sa faute. */
function substitute(text: string, values: Record<string, string>): string {
  return text.replace(TOKEN_PATTERN, (whole, key: string) => {
    const value = values[key.trim()];
    return value === undefined ? whole : value;
  });
}

function criteriaValues(audit: Audit, criteria: CriteriaRGAA): Record<string, string> {
  const status = statusOf(audit, criteria.id);
  return {
    id: criteria.id,
    titre: cleanCriteriaTitle(criteria.title),
    description: criteria.description ?? '',
    niveau: criteria.level,
    thème: criteria.theme,
    statut: getStatusPresentation(status, audit.mode).label,
    note: audit.notes[criteria.id] ?? '',
    urls: (audit.pages[criteria.id] ?? []).join(', '),
    tests: (audit.checkedTests[criteria.id] ?? []).join(', '),
    provenance: provenanceOf(audit, criteria.id),
  };
}

function auditValues({ audit, criteria }: TemplateData): Record<string, string> {
  const view = toSummaryView(calculateSummaryStats(criteria, audit.progress, audit.mode), audit.mode);
  // La provenance disparaît avec le statut repris en main : compter les entrées
  // restantes suffit, il n'y a rien à réconcilier avec `progress`.
  const auto = criteria.map(c => audit.auto?.[c.id]).filter(entry => entry !== undefined);
  const scannedAt = auto.map(entry => entry.scannedAt).sort().at(-1);
  return {
    nomAudit: audit.name,
    périmètre: audit.scope ?? '',
    date: new Date().toLocaleDateString('fr-FR'),
    mode: modeLabel(audit.mode),
    taux: view.rate === null ? 'non calculable' : `${Math.round(view.rate)} %`,
    libelléTaux: view.rateLabel,
    évalués: String(view.evaluated),
    total: String(view.total),
    préRemplis: String(auto.length),
    dateScan: scannedAt === undefined ? '' : new Date(scannedAt).toLocaleDateString('fr-FR'),
  };
}

export function renderTemplate(template: string, data: TemplateData): string {
  const { audit, criteria } = data;

  // Les blocs d'abord : leurs jetons de critère n'existent que dedans, et ceux
  // laissés au dehors doivent rester visibles plutôt que d'être vidés.
  const withBlocks = template.replace(BLOCK_PATTERN, (_whole, filter: string | undefined, body: string) => {
    const rows = criteria.filter(c => {
      const bucket = bucketOf(statusOf(audit, c.id));
      return filter ? bucket === filter : bucket !== 'aEvaluer';
    });
    return rows.map(c => substitute(body, criteriaValues(audit, c))).join('');
  });

  return substitute(withBlocks, auditValues(data));
}

/**
 * Le gabarit vient de localStorage, donc du dehors : il se valide avant emploi.
 * Un bloc imbriqué est refusé — la grammaire n'en a pas besoin, et l'accepter
 * demanderait un vrai analyseur.
 */
export function isValidTemplate(template: string): boolean {
  if (typeof template !== 'string' || template.length > TEMPLATE_MAX_LENGTH) return false;

  let depth = 0;
  for (const [, marker] of template.matchAll(/\{\{(#critères(?::[a-zA-Z]+)?|\/critères)\}\}/g)) {
    depth += marker.startsWith('#') ? 1 : -1;
    if (depth < 0 || depth > 1) return false;
  }
  return depth === 0;
}

/**
 * Les gabarits livrés reproduisent l'export historique de chaque mode : qui ne
 * les touche pas ne voit rien changer. Seule différence assumée — un titre de
 * section reste affiché même si son seau est vide, l'ancien code l'omettait.
 * Le gabarit étant éditable, la ligne se retire d'un coup de clavier.
 */
export const DEFAULT_TEMPLATES: Record<Mode, string> = {
  classic: `# Rapport de Conformité RGAA - Accessipote

Date : {{date}}
{{libelléTaux}} : {{taux}} ({{évalués}}/{{total}} critères évalués)

## Critères Conformes

{{#critères:ok}}### {{id}} - {{titre}}
{{description}}

{{/critères}}
## Critères Non Conformes

{{#critères:ecarts}}### {{id}} - {{titre}}
{{description}}

{{/critères}}
## Critères Non Applicables

{{#critères:na}}### {{id}} - {{titre}}
{{description}}

{{/critères}}`,

  'design-system': `# Checklist Design System - Conformité RGAA - Accessipote

Date : {{date}}
{{libelléTaux}} : {{taux}} ({{évalués}}/{{total}} critères évalués)

## Conformes par défaut

| Numéro | Titre |
|--------|-------|
{{#critères:ok}}| {{id}} | {{titre}} |
{{/critères}}

## À mettre en place côté projet

| Numéro | Titre |
|--------|-------|
{{#critères:ecarts}}| {{id}} | {{titre}} |
{{/critères}}`,
};
