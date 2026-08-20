import { describe, it, expect } from 'vitest';
import {
  RGAA_MAPPING,
  MAPPED_CRITERIA,
  FAIL_SELECTORS,
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
    const doublons = MAIN_FRAME_FAIL_SELECTORS.filter(selector => FAIL_SELECTORS.includes(selector));
    expect(doublons).toEqual([]);
  });

  it('les critères « dans chaque page web » ignorent les documents embarqués', () => {
    const parPage = RGAA_MAPPING.filter(mapping => mapping.mainFrameOnly).map(m => m.testId);
    expect(parPage).toEqual(['8.3.1', '8.5.1']);
  });
});
