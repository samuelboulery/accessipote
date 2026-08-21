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

/**
 * Le lot mécanique : un code de langue est valide ou ne l'est pas, un `id` est
 * unique ou ne l'est pas. Aucun jugement, et donc aucune raison de se contenter
 * d'un indice — sauf là où la règle parle d'unicité quand le test parle de
 * pertinence.
 */
describe('rgaaMapping — lot éléments obligatoires', () => {
  const ruleOf = (testId: string) =>
    RGAA_MAPPING.find(mapping => mapping.testId === testId)?.axeRules ?? [];
  const hintOf = (testId: string) =>
    RGAA_MAPPING.find(mapping => mapping.testId === testId)?.probableRules ?? [];

  it('tranche la validité du code de langue par défaut', () => {
    expect(ruleOf('8.4.1')).toEqual(['html-lang-valid']);
  });

  it('tranche la validité du code de langue des changements de langue', () => {
    expect(ruleOf('8.8.1')).toEqual(['valid-lang']);
  });

  it('signale les identifiants dupliqués sans les écrire', () => {
    // Les résultats d'axe sont fusionnés tous cadres confondus : un `id`
    // dupliqué dans un `<iframe>` n'est pas celui de la page.
    expect(hintOf('8.2.1')).toEqual(['duplicate-id-aria']);
    expect(ruleOf('8.2.1')).toEqual([]);
  });

  it('ne retient qu’un indice là où la règle parle d’autre chose que le test', () => {
    // Deux cadres au même titre ne prouvent pas l'impertinence du titre : ils
    // la rendent probable.
    expect(hintOf('2.2.1')).toEqual(['frame-title-unique']);
    // Un `lang` et un `xml:lang` qui divergent disent que l'un des deux est
    // faux, sans dire lequel.
    expect(hintOf('8.4.1')).toEqual(['html-xml-lang-mismatch']);
  });

  it('laisse 8.7 à l’auditeur : reconnaître un changement de langue n’est pas mécanique', () => {
    expect(MAPPED_CRITERIA).not.toContain('8.7');
  });

  it('aucun de ces tests ne prouve la conformité', () => {
    const bavards = ['8.2.1', '8.4.1', '8.8.1', '2.2.1'].filter(
      testId => RGAA_MAPPING.find(mapping => mapping.testId === testId)?.provesPass,
    );
    expect(bavards).toEqual([]);
  });
});

/**
 * Le thème 7 est le cas où la retenue coûte le plus cher : axe y consacre une
 * vingtaine de règles, et le référentiel ouvre presque partout une porte de
 * sortie — « une alternative accessible permet d'accéder aux mêmes
 * fonctionnalités ». Une règle qui ignore cette porte ne peut pas prouver.
 */
describe('rgaaMapping — lot ARIA et scripts', () => {
  const ruleOf = (testId: string) =>
    RGAA_MAPPING.find(mapping => mapping.testId === testId)?.axeRules ?? [];
  const hintOf = (testId: string) =>
    RGAA_MAPPING.find(mapping => mapping.testId === testId)?.probableRules ?? [];

  it('couvre les deux critères du thème 7 qui se constatent', () => {
    expect(MAPPED_CRITERIA).toEqual(expect.arrayContaining(['7.1', '7.3']));
  });

  it('ne mappe pas ce qui suppose de comprendre l’intention du script', () => {
    // 7.2 alternative pertinente, 7.4 changement de contexte, 7.5 message de
    // statut : trois fois, il faudrait savoir ce que le script veut dire.
    expect(MAPPED_CRITERIA).not.toContain('7.2');
    expect(MAPPED_CRITERIA).not.toContain('7.4');
    expect(MAPPED_CRITERIA).not.toContain('7.5');
  });

  it('tient les défauts ARIA pour des indices, jamais pour des preuves', () => {
    expect(hintOf('7.1.1')).toEqual(
      expect.arrayContaining([
        'aria-valid-attr',
        'aria-valid-attr-value',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-allowed-attr',
        'aria-hidden-focus',
        'nested-interactive',
      ]),
    );
    expect(ruleOf('7.1.1')).toEqual([]);
  });

  it('prouve l’échec là où le test ne laisse aucune porte de sortie', () => {
    // 7.1.3 exige un nom et un rôle pertinents, sans alternative de repli : un
    // composant sans nom accessible échoue, et un nom accessible qui ne
    // contient pas l'intitulé visible est le libellé même du test.
    expect(ruleOf('7.1.3')).toEqual(
      expect.arrayContaining([
        'aria-command-name',
        'aria-input-field-name',
        'aria-toggle-field-name',
        'label-content-name-mismatch',
      ]),
    );
  });

  it('signale une zone défilante inatteignable au clavier sans la condamner', () => {
    expect(hintOf('7.3.1')).toEqual(['scrollable-region-focusable']);
  });

  it('aucun test du thème 7 ne prouve la conformité', () => {
    const bavards = RGAA_MAPPING.filter(
      mapping => mapping.criterionId.startsWith('7.') && mapping.provesPass,
    );
    expect(bavards.map(mapping => mapping.testId)).toEqual([]);
  });
});
