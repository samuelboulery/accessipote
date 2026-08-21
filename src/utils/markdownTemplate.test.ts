import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderTemplate, isValidTemplate, DEFAULT_TEMPLATES, TEMPLATE_MAX_LENGTH } from './markdownTemplate';
import type { Audit, CriteriaRGAA } from '../types';

const criteria: CriteriaRGAA[] = [
  {
    id: '1.1',
    title: 'Image porteuse d’information',
    description: 'Description 1.1',
    url: 'https://example.com/1.1',
    theme: 'Images',
    level: 'A',
  },
  {
    id: '1.2',
    title: 'Image [de décoration](https://example.com/deco)',
    description: 'Description 1.2',
    url: 'https://example.com/1.2',
    theme: 'Images',
    level: 'A',
  },
  {
    id: '3.1',
    title: 'Information par la couleur',
    description: 'Description 3.1',
    url: 'https://example.com/3.1',
    theme: 'Couleurs',
    level: 'A',
  },
  {
    id: '4.1',
    title: 'Média temporel',
    description: 'Description 4.1',
    url: 'https://example.com/4.1',
    theme: 'Multimédia',
    level: 'A',
  },
];

function makeAudit(overrides: Partial<Audit> = {}): Audit {
  return {
    id: 'audit-1',
    name: 'Site vitrine',
    scope: 'https://exemple.fr',
    mode: 'classic',
    themes: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    progress: {
      '1.1': { status: 'conforme' },
      '1.2': { status: 'non-conforme' },
      '3.1': { status: 'non-applicable' },
    },
    notes: { '1.2': 'Alternative absente sur la page d’accueil.' },
    pages: { '1.2': ['https://exemple.fr/', 'https://exemple.fr/contact'] },
    checkedTests: { '1.2': ['1.2.1', '1.2.2'] },
    ...overrides,
  };
}

const dsAudit = makeAudit({
  mode: 'design-system',
  progress: {
    '1.1': { status: 'default-compliant' },
    '1.2': { status: 'project-implementation' },
    '3.1': { status: 'non-applicable' },
  },
});

describe('renderTemplate — jetons de premier niveau', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T09:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('substitue le nom, le périmètre et la date', () => {
    const out = renderTemplate('{{nomAudit}} — {{périmètre}} — {{date}}', {
      audit: makeAudit(),
      criteria,
    });
    expect(out).toBe(`Site vitrine — https://exemple.fr — ${new Date().toLocaleDateString('fr-FR')}`);
  });

  it('rend le taux et son libellé selon le mode classique', () => {
    const out = renderTemplate('{{libelléTaux}} : {{taux}}', { audit: makeAudit(), criteria });
    // 1 conforme sur 1 conforme + 1 non conforme
    expect(out).toBe('Taux de conformité : 50 %');
  });

  it('rend le taux et son libellé selon le mode design system', () => {
    const out = renderTemplate('{{libelléTaux}} : {{taux}}', { audit: dsAudit, criteria });
    expect(out).toBe('Taux de prise en charge par le design system : 50 %');
  });

  it('rend « non calculable » quand aucun critère n’est tranché', () => {
    const audit = makeAudit({ progress: {}, notes: {}, pages: {}, checkedTests: {} });
    expect(renderTemplate('{{taux}}', { audit, criteria })).toBe('non calculable');
  });

  it('rend le nombre de critères évalués et le total', () => {
    expect(renderTemplate('{{évalués}}/{{total}}', { audit: makeAudit(), criteria })).toBe('3/4');
  });

  it('rend le mode en toutes lettres', () => {
    expect(renderTemplate('{{mode}}', { audit: makeAudit(), criteria })).toBe('Classic');
    expect(renderTemplate('{{mode}}', { audit: dsAudit, criteria })).toBe('Design System');
  });

  it('rend une chaîne vide pour un périmètre absent', () => {
    const audit = makeAudit({ scope: undefined });
    expect(renderTemplate('[{{périmètre}}]', { audit, criteria })).toBe('[]');
  });

  it('laisse un jeton inconnu tel quel', () => {
    expect(renderTemplate('{{inexistant}}', { audit: makeAudit(), criteria })).toBe('{{inexistant}}');
  });
});

describe('renderTemplate — blocs de critères', () => {
  it('répète le bloc sur les seuls critères évalués', () => {
    const out = renderTemplate('{{#critères}}- {{id}}\n{{/critères}}', {
      audit: makeAudit(),
      criteria,
    });
    expect(out).toBe('- 1.1\n- 1.2\n- 3.1\n');
  });

  it('expose les jetons de critère, titre nettoyé de ses liens markdown', () => {
    const out = renderTemplate('{{#critères}}{{id}}|{{titre}}|{{niveau}}|{{thème}}|{{statut}}\n{{/critères}}', {
      audit: makeAudit(),
      criteria,
    });
    expect(out).toContain('1.2|Image de décoration|A|Images|Non conforme');
  });

  it('expose la note, les URLs et les tests cochés', () => {
    const out = renderTemplate('{{#critères}}{{note}}::{{urls}}::{{tests}}\n{{/critères}}', {
      audit: makeAudit(),
      criteria,
    });
    expect(out).toContain(
      'Alternative absente sur la page d’accueil.::https://exemple.fr/, https://exemple.fr/contact::1.2.1, 1.2.2',
    );
  });

  it('rend une chaîne vide pour une note, des URLs ou des tests absents', () => {
    const out = renderTemplate('{{#critères}}[{{note}}{{urls}}{{tests}}]\n{{/critères}}', {
      audit: makeAudit(),
      criteria,
    });
    expect(out).toContain('[]');
  });

  it('filtre sur le seau « ok » et donne le libellé du mode classique', () => {
    const out = renderTemplate('{{#critères:ok}}{{id}} {{statut}}{{/critères}}', {
      audit: makeAudit(),
      criteria,
    });
    expect(out).toBe('1.1 Conforme');
  });

  it('filtre sur le seau « ok » et donne le libellé du mode design system', () => {
    const out = renderTemplate('{{#critères:ok}}{{id}} {{statut}}{{/critères}}', {
      audit: dsAudit,
      criteria,
    });
    expect(out).toBe('1.1 Conforme par défaut');
  });

  it('filtre sur le seau « ecarts » dans les deux modes', () => {
    expect(
      renderTemplate('{{#critères:ecarts}}{{id}} {{statut}}{{/critères}}', { audit: makeAudit(), criteria }),
    ).toBe('1.2 Non conforme');
    expect(
      renderTemplate('{{#critères:ecarts}}{{id}} {{statut}}{{/critères}}', { audit: dsAudit, criteria }),
    ).toBe('1.2 À mettre en place');
  });

  it('filtre sur le seau « na »', () => {
    expect(renderTemplate('{{#critères:na}}{{id}}{{/critères}}', { audit: makeAudit(), criteria })).toBe('3.1');
  });

  it('filtre sur le seau « aEvaluer », seul bloc à sortir des critères sans statut', () => {
    expect(
      renderTemplate('{{#critères:aEvaluer}}{{id}} {{statut}}{{/critères}}', { audit: makeAudit(), criteria }),
    ).toBe('4.1 À évaluer');
  });

  it('rend une chaîne vide quand le seau est vide', () => {
    const audit = makeAudit({ progress: { '1.1': { status: 'conforme' } } });
    expect(renderTemplate('[{{#critères:na}}{{id}}{{/critères}}]', { audit, criteria })).toBe('[]');
  });

  it('laisse un filtre inconnu produire un bloc vide sans planter', () => {
    expect(renderTemplate('[{{#critères:zzz}}{{id}}{{/critères}}]', { audit: makeAudit(), criteria })).toBe('[]');
  });

  it('rend plusieurs blocs et du texte autour', () => {
    const out = renderTemplate(
      '# {{nomAudit}}\n\n## OK\n{{#critères:ok}}- {{id}}\n{{/critères}}\n## KO\n{{#critères:ecarts}}- {{id}}\n{{/critères}}',
      { audit: makeAudit(), criteria },
    );
    expect(out).toBe('# Site vitrine\n\n## OK\n- 1.1\n\n## KO\n- 1.2\n');
  });

  it('ignore un jeton de critère employé hors d’un bloc', () => {
    expect(renderTemplate('{{id}}', { audit: makeAudit(), criteria })).toBe('{{id}}');
  });
});

describe('isValidTemplate', () => {
  it('accepte un gabarit sans bloc', () => {
    expect(isValidTemplate('# {{nomAudit}}')).toBe(true);
  });

  it('accepte des blocs équilibrés', () => {
    expect(isValidTemplate('{{#critères}}a{{/critères}}{{#critères:ok}}b{{/critères}}')).toBe(true);
  });

  it('refuse un bloc non fermé', () => {
    expect(isValidTemplate('{{#critères}}a')).toBe(false);
  });

  it('refuse une fermeture orpheline', () => {
    expect(isValidTemplate('a{{/critères}}')).toBe(false);
  });

  it('refuse un gabarit trop long', () => {
    expect(isValidTemplate('a'.repeat(TEMPLATE_MAX_LENGTH + 1))).toBe(false);
  });

  it('refuse ce qui n’est pas une chaîne', () => {
    expect(isValidTemplate(undefined as unknown as string)).toBe(false);
    expect(isValidTemplate(42 as unknown as string)).toBe(false);
  });
});

describe('DEFAULT_TEMPLATES', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T09:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sont valides dans les deux modes', () => {
    expect(isValidTemplate(DEFAULT_TEMPLATES.classic)).toBe(true);
    expect(isValidTemplate(DEFAULT_TEMPLATES['design-system'])).toBe(true);
  });

  it('reproduit en classique les sections détaillées de l’export historique', () => {
    const out = renderTemplate(DEFAULT_TEMPLATES.classic, { audit: makeAudit(), criteria });
    expect(out).toContain('# Rapport de Conformité RGAA - Accessipote');
    expect(out).toContain('## Critères Conformes');
    expect(out).toContain('### 1.1 - Image porteuse d’information');
    expect(out).toContain('## Critères Non Conformes');
    expect(out).toContain('### 1.2 - Image de décoration');
    expect(out).toContain('## Critères Non Applicables');
    expect(out).toContain('### 3.1 - Information par la couleur');
    // Un critère sans statut n'entre dans aucune section.
    expect(out).not.toContain('4.1');
  });

  it('reproduit en design system les tableaux de l’export historique', () => {
    const out = renderTemplate(DEFAULT_TEMPLATES['design-system'], { audit: dsAudit, criteria });
    expect(out).toContain('# Checklist Design System - Conformité RGAA - Accessipote');
    expect(out).toContain('## Conformes par défaut');
    expect(out).toContain('| Numéro | Titre |');
    expect(out).toContain('| 1.1 | Image porteuse d’information |');
    expect(out).toContain('## À mettre en place côté projet');
    expect(out).toContain('| 1.2 | Image de décoration |');
  });
});

describe('renderTemplate — provenance du scan', () => {
  const auto = {
    '1.2': {
      status: 'non-conforme' as const,
      testIds: ['1.2.1'],
      scannedAt: '2026-08-20T09:30:00.000Z',
      evidence: [{ url: 'https://exemple.fr/', selector: 'img' }],
    },
    '3.1': {
      status: 'non-applicable' as const,
      testIds: [],
      scannedAt: '2026-08-20T09:30:00.000Z',
      evidence: [],
    },
  };

  it('compte les critères pré-remplis et donne la date du scan', () => {
    const out = renderTemplate('{{préRemplis}} le {{dateScan}}', {
      audit: makeAudit({ auto }),
      criteria,
    });
    expect(out).toBe('2 le 20/08/2026');
  });

  it('rend un décompte nul et une date vide sans provenance', () => {
    const out = renderTemplate('[{{préRemplis}}][{{dateScan}}]', { audit: makeAudit(), criteria });
    expect(out).toBe('[0][]');
  });

  it('marque le critère pré-rempli dans un bloc, et lui seul', () => {
    const out = renderTemplate('{{#critères}}{{id}}:{{provenance}}|{{/critères}}', {
      audit: makeAudit({ auto }),
      criteria,
    });
    expect(out).toBe('1.1:|1.2:scan automatique du 20/08/2026 (tests 1.2.1)|3.1:scan automatique du 20/08/2026|');
  });

  it('suit la reprise en main : le statut modifié n’est plus compté', () => {
    // L'application supprime la provenance en même temps qu'elle change le
    // statut ; le décompte n'a donc rien à recalculer de son côté.
    const out = renderTemplate('{{préRemplis}}', {
      audit: makeAudit({ auto: { '3.1': auto['3.1'] } }),
      criteria,
    });
    expect(out).toBe('1');
  });
});

describe('renderTemplate — provenance sur indice', () => {
  it('distingue un statut posé sur indice d’un statut prouvé', () => {
    const out = renderTemplate('{{#critères}}{{id}}:{{provenance}}|{{/critères}}', {
      audit: makeAudit({
        auto: {
          '1.2': {
            status: 'non-conforme',
            testIds: ['1.2.1'],
            scannedAt: '2026-08-20T09:30:00.000Z',
            evidence: [],
            fromHint: true,
          },
        },
      }),
      criteria,
    });
    expect(out).toContain('1.2:indice du scan automatique du 20/08/2026 (tests 1.2.1)');
  });
});
