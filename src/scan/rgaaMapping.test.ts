import { describe, it, expect } from 'vitest';
import {
  RGAA_MAPPING,
  MAPPED_CRITERIA,
  FOUND_SELECTORS,
  MAIN_FRAME_FAIL_SELECTORS,
} from './rgaaMapping.ts';
import criteriaData from '../data/criteria.json';
import { transformCriteriaData } from '../utils/transformCriteria';
import type { CriteriaRawData } from '../types';

const criteria = transformCriteriaData(criteriaData as CriteriaRawData);
const byId = new Map(criteria.map(criterion => [criterion.id, criterion]));

describe('rgaaMapping — ancrage dans les données RGAA', () => {
  it('chaque critère cité existe dans criteria.json', () => {
    const inconnus = RGAA_MAPPING.filter(mapping => !byId.has(mapping.criterionId));
    expect(inconnus.map(mapping => mapping.criterionId)).toEqual([]);
  });

  it('chaque test cité existe dans son critère', () => {
    const inconnus = RGAA_MAPPING.filter(mapping => {
      const criterion = byId.get(mapping.criterionId);
      const numero = mapping.testId.slice(mapping.criterionId.length + 1);
      return !criterion?.tests?.some(test => test.id === numero);
    });
    expect(inconnus.map(mapping => mapping.testId)).toEqual([]);
  });

  it("l'identifiant du test commence par celui de son critère", () => {
    const mauvais = RGAA_MAPPING.filter(
      mapping => !mapping.testId.startsWith(`${mapping.criterionId}.`),
    );
    expect(mauvais.map(mapping => mapping.testId)).toEqual([]);
  });

  it('aucun test n\'est cité deux fois', () => {
    const ids = RGAA_MAPPING.map(mapping => mapping.testId);
    expect(ids).toHaveLength(new Set(ids).size);
  });
});

describe('rgaaMapping — conditions du non applicable', () => {
  /**
   * Le piège central du mapping partiel : déclarer un critère non applicable
   * alors qu'un seul de ses tests a été regardé. Un critère dont tous les tests
   * ne sont pas couverts ne peut jamais conclure au non applicable.
   */
  it('un critère qui peut conclure au non applicable a tous ses tests mappés', () => {
    const incomplets = MAPPED_CRITERIA.filter(criterionId => {
      const mappings = RGAA_MAPPING.filter(mapping => mapping.criterionId === criterionId);
      if (!mappings.every(mapping => mapping.naWhen !== undefined)) return false;
      return mappings.length !== (byId.get(criterionId)?.tests?.length ?? 0);
    });
    expect(incomplets).toEqual([]);
  });
});

describe('rgaaMapping — retenue sur le conforme', () => {
  it('un test qui prouve le succès sait le vérifier', () => {
    const bavards = RGAA_MAPPING.filter(
      mapping => mapping.provesPass && mapping.failWhen === undefined && mapping.axeRules === undefined,
    );
    expect(bavards.map(mapping => mapping.testId)).toEqual([]);
  });

  it('un critère ne peut être conforme que si tous ses tests sont mappés', () => {
    const menteurs = MAPPED_CRITERIA.filter(criterionId => {
      const mappings = RGAA_MAPPING.filter(mapping => mapping.criterionId === criterionId);
      if (!mappings.every(mapping => mapping.provesPass)) return false;
      return mappings.length !== (byId.get(criterionId)?.tests?.length ?? 0);
    });
    expect(menteurs).toEqual([]);
  });
});

describe('rgaaMapping — portée des sélecteurs', () => {
  it("un sélecteur du document principal n'est pas aussi cherché dans les cadres", () => {
    const doublons = MAIN_FRAME_FAIL_SELECTORS.filter(selector => FOUND_SELECTORS.includes(selector));
    expect(doublons).toEqual([]);
  });

  it('les critères « dans chaque page web » ignorent les documents embarqués', () => {
    const parPage = RGAA_MAPPING.filter(mapping => mapping.mainFrameOnly).map(m => m.testId);
    expect(parPage).toEqual(['8.3.1', '8.5.1']);
  });
});

/**
 * Le thème 11 est le plus gros gisement du référentiel : treize critères qu'une
 * page sans champ de formulaire écarte d'un coup. Encore faut-il que l'absence
 * soit constatée sur une page où le champ pouvait apparaître — d'où le support
 * volatil, qui garde ces non applicables sous l'œil de l'auditeur.
 */
describe('rgaaMapping — lot formulaires', () => {
  const THEME_11 = Array.from({ length: 13 }, (_, index) => `11.${index + 1}`);

  it('couvre les treize critères du thème 11', () => {
    expect(THEME_11.filter(id => !MAPPED_CRITERIA.includes(id))).toEqual([]);
  });

  it('mappe tous les tests de chaque critère du thème 11', () => {
    const incomplets = THEME_11.filter(id => {
      const mappings = RGAA_MAPPING.filter(mapping => mapping.criterionId === id);
      return mappings.length !== (byId.get(id)?.tests?.length ?? 0);
    });
    expect(incomplets).toEqual([]);
  });

  it('conclut au non applicable sur chaque test du thème 11', () => {
    const sansSupport = RGAA_MAPPING.filter(
      mapping => THEME_11.includes(mapping.criterionId) && mapping.naWhen === undefined,
    );
    expect(sansSupport.map(mapping => mapping.testId)).toEqual([]);
  });

  it('tient le support de formulaire pour volatil, jamais pour prouvé', () => {
    const durs = RGAA_MAPPING.filter(
      mapping => THEME_11.includes(mapping.criterionId) && mapping.volatileSupport !== true,
    );
    expect(durs.map(mapping => mapping.testId)).toEqual([]);
  });

  it('aucun test du thème 11 ne prouve la conformité', () => {
    const bavards = RGAA_MAPPING.filter(
      mapping => THEME_11.includes(mapping.criterionId) && mapping.provesPass,
    );
    expect(bavards.map(mapping => mapping.testId)).toEqual([]);
  });

  it('détecte les échecs que les règles axe recouvrent exactement', () => {
    const ruleOf = (testId: string) =>
      RGAA_MAPPING.find(mapping => mapping.testId === testId)?.axeRules ?? [];

    expect(ruleOf('11.1.1')).toEqual(expect.arrayContaining(['label', 'select-name']));
    expect(ruleOf('11.9.1')).toEqual(
      expect.arrayContaining(['button-name', 'input-button-name']),
    );
    expect(ruleOf('11.13.1')).toEqual(['autocomplete-valid']);
  });

  it('ne retient qu’un indice là où la règle axe déborde le test RGAA', () => {
    const hintOf = (testId: string) =>
      RGAA_MAPPING.find(mapping => mapping.testId === testId)?.probableRules ?? [];

    // Le RGAA admet `title` comme étiquette, sous condition de contenu : axe le
    // refuse par principe. Il montre où regarder, il ne tranche pas.
    expect(hintOf('11.1.3')).toEqual(['label-title-only']);
    expect(hintOf('11.2.1')).toEqual(['form-field-multiple-labels']);
  });
});

/**
 * Le thème 1 se partage en deux : de la mécanique — un support absent, une
 * alternative absente — et du jugement pur. Le critère 1.3, pertinence des
 * alternatives, reste entièrement à l'auditeur : il n'est pas mappé du tout,
 * pas même pour le non applicable.
 */
describe('rgaaMapping — lot images', () => {
  const COUVERTS = ['1.1', '1.2', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9'];

  it('couvre huit des neuf critères du thème 1', () => {
    expect(COUVERTS.filter(id => !MAPPED_CRITERIA.includes(id))).toEqual([]);
  });

  it('laisse la pertinence des alternatives entièrement à l’auditeur', () => {
    expect(MAPPED_CRITERIA).not.toContain('1.3');
  });

  it('mappe tous les tests de chaque critère couvert', () => {
    const incomplets = COUVERTS.filter(id => {
      const mappings = RGAA_MAPPING.filter(mapping => mapping.criterionId === id);
      return mappings.length !== (byId.get(id)?.tests?.length ?? 0);
    });
    expect(incomplets).toEqual([]);
  });

  it('tient le support d’image pour volatil — galerie au défilement, onglet déplié', () => {
    const durs = RGAA_MAPPING.filter(
      mapping => COUVERTS.includes(mapping.criterionId) && mapping.volatileSupport !== true,
    );
    expect(durs.map(mapping => mapping.testId)).toEqual([]);
  });

  it('aucun test du thème 1 ne prouve la conformité', () => {
    const bavards = RGAA_MAPPING.filter(
      mapping => COUVERTS.includes(mapping.criterionId) && mapping.provesPass,
    );
    expect(bavards.map(mapping => mapping.testId)).toEqual([]);
  });

  it('détecte les échecs que les règles axe recouvrent exactement', () => {
    const ruleOf = (testId: string) =>
      RGAA_MAPPING.find(mapping => mapping.testId === testId)?.axeRules ?? [];

    expect(ruleOf('1.1.1')).toEqual(['role-img-alt']);
    expect(ruleOf('1.1.2')).toEqual(['area-alt']);
    expect(ruleOf('1.1.3')).toEqual(['input-image-alt']);
    expect(ruleOf('1.1.5')).toEqual(['svg-img-alt']);
  });

  it('ne retient qu’un indice là où la règle axe déborde le test RGAA', () => {
    const hintOf = (testId: string) =>
      RGAA_MAPPING.find(mapping => mapping.testId === testId)?.probableRules ?? [];

    // `object-alt` vise tous les `<object>`, quand le test ne vise que ceux qui
    // portent une image : le reste relève du thème 4.
    expect(hintOf('1.1.6')).toEqual(['object-alt']);
    // Une image de décoration mal marquée est un indice de 1.2 — encore
    // faudrait-il savoir qu'elle est décorative, ce qu'aucune machine ne sait.
    expect(hintOf('1.2.1')).toEqual(
      expect.arrayContaining(['image-redundant-alt', 'presentation-role-conflict']),
    );
  });
});
