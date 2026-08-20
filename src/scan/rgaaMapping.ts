import type { RgaaMapping } from './types.ts';

/**
 * Correspondance entre les tests RGAA et ce qui permet de les trancher.
 *
 * Écrite à la main, un test à la fois. axe-core mappe ses règles vers WCAG, pas
 * vers le RGAA : reprendre sa correspondance telle quelle serait la première
 * source d'erreur. Deux exemples, tous deux vérifiés :
 *
 * - `frame-title` se satisfait d'un nom accessible, donc d'un `aria-label`, là
 *   où le test 2.1.1 exige l'attribut `title` ;
 * - `link-name` accepte lui aussi `aria-label`, quand le test 6.2.1 demande un
 *   intitulé « entre `<a>` et `</a>` ».
 *
 * Là où le référentiel est plus littéral que l'outil, un sélecteur (`failWhen`)
 * remplace la règle et dit exactement ce que le RGAA dit.
 *
 * Deux invariants, tenus par `rgaaMapping.test.ts` :
 *
 * - un critère ne conclut au non applicable que si **tous** ses tests RGAA sont
 *   mappés. Sinon l'absence constatée ne porterait que sur ce qu'on a regardé ;
 * - un critère ne conclut au conforme que si tous ses tests le prouvent, et
 *   `provesPass` n'est vrai que pour de la présence ou du format pure.
 */

// — Supports dont l'absence rend un thème sans objet ——————————————————————
// Volontairement larges : un sélecteur trop large rend le non applicable plus
// difficile à conclure, ce qui est le sens prudent.
const FRAME = 'iframe, frame';
const MEDIA = 'video, audio, object, embed, applet, bgsound, canvas';
const TABLE = 'table';
const FIELD = [
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="spinbutton"]',
  '[role="slider"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
].join(', ');

/**
 * Balises dont la seule fonction est présentationnelle.
 *
 * `<b>`, `<i>`, `<u>` et `<s>` en sont absents à dessein : HTML5 leur a rendu
 * un sens sémantique, donc leur présence ne prouve plus rien.
 */
const PRESENTATION_TAGS = 'font, center, marquee, blink, basefont, big, tt, strike';

/** Attributs de présentation, restreints aux éléments où ils existent vraiment. */
const PRESENTATION_ATTRS = [
  '[bgcolor]',
  '[background]',
  '[cellpadding]',
  '[cellspacing]',
  '[hspace]',
  '[vspace]',
  '[valign]',
  '[marginwidth]',
  '[marginheight]',
  '[noshade]',
  '[nowrap]',
  'table[border]',
  'img[border]',
  'object[border]',
  'table[align]',
  'td[align]',
  'th[align]',
  'tr[align]',
  'img[align]',
  'p[align]',
  'div[align]',
  'hr[align]',
  'caption[align]',
  'body[text]',
  'body[link]',
  'body[vlink]',
  'body[alink]',
].join(', ');

/**
 * Décline les `count` tests d'un critère en entrées qui ne savent conclure
 * qu'au non applicable.
 *
 * `count` est écrit ici, et non lu dans `criteria.json` : c'est ce qui permet
 * au garde-fou de détecter qu'un test a été ajouté au référentiel, au lieu de
 * suivre le changement en silence.
 */
function naOnly(criterionId: string, count: number, naWhen: string): RgaaMapping[] {
  return Array.from({ length: count }, (_, index) => ({
    testId: `${criterionId}.${index + 1}`,
    criterionId,
    naWhen,
    provesPass: false,
  }));
}

export const RGAA_MAPPING: RgaaMapping[] = [
  // — 1.1 Alternative textuelle des images ————————————————————————————————
  // Aucun test ne prouve le succès : l'absence d'attribut `alt` est un échec
  // certain, mais sa présence ne dit rien de la pertinence de son contenu —
  // c'est le critère 1.3, et c'est du ressort de l'auditeur.
  {
    testId: '1.1.1',
    criterionId: '1.1',
    failWhen: 'img:not([alt])',
    naWhen: 'img, [role="img"]',
    provesPass: false,
  },
  {
    testId: '1.1.2',
    criterionId: '1.1',
    failWhen: 'area[href]:not([alt])',
    naWhen: 'area[href]',
    provesPass: false,
  },
  {
    testId: '1.1.3',
    criterionId: '1.1',
    failWhen: 'input[type="image"]:not([alt])',
    naWhen: 'input[type="image"]',
    provesPass: false,
  },
  { testId: '1.1.4', criterionId: '1.1', naWhen: 'img[ismap]', provesPass: false },
  { testId: '1.1.5', criterionId: '1.1', naWhen: 'svg', provesPass: false },
  { testId: '1.1.6', criterionId: '1.1', naWhen: 'object[type^="image/"]', provesPass: false },
  { testId: '1.1.7', criterionId: '1.1', naWhen: 'embed[type^="image/"]', provesPass: false },
  { testId: '1.1.8', criterionId: '1.1', naWhen: 'canvas', provesPass: false },

  // — 2.1 Titre de cadre ——————————————————————————————————————————————————
  // Le seul critère du lot qui prouve sa conformité par un sélecteur : le test
  // porte sur la présence d'un attribut, rien d'autre.
  {
    testId: '2.1.1',
    criterionId: '2.1',
    failWhen: 'iframe:not([title]), frame:not([title]), iframe[title=""], frame[title=""]',
    naWhen: FRAME,
    provesPass: true,
  },
  // 2.2 : pertinence du titre de cadre. Hors de portée d'une machine.
  ...naOnly('2.2', 1, FRAME),

  // — Thème 4 Multimédia ——————————————————————————————————————————————————
  // Treize critères, vingt-cinq tests, aucun automatisable : transcriptions,
  // sous-titres, audiodescription et pertinence relèvent tous du jugement. Le
  // mapping ne sert qu'à écarter le thème entier quand la page ne contient
  // aucun média — et c'est le plus gros gain du scan.
  ...naOnly('4.1', 3, MEDIA),
  ...naOnly('4.2', 3, MEDIA),
  ...naOnly('4.3', 2, MEDIA),
  ...naOnly('4.4', 1, MEDIA),
  ...naOnly('4.5', 2, MEDIA),
  ...naOnly('4.6', 2, MEDIA),
  ...naOnly('4.7', 1, MEDIA),
  ...naOnly('4.8', 2, MEDIA),
  ...naOnly('4.9', 1, MEDIA),
  ...naOnly('4.10', 1, MEDIA),
  ...naOnly('4.11', 3, MEDIA),
  ...naOnly('4.12', 2, MEDIA),
  ...naOnly('4.13', 2, MEDIA),

  // — Thème 5 Tableaux ————————————————————————————————————————————————————
  // Distinguer un tableau de données d'un tableau de mise en forme est un acte
  // d'auditeur. D'où l'absence de détection d'échec sur 5.1 à 5.6 : elle
  // supposerait cette distinction.
  ...naOnly('5.1', 1, TABLE),
  ...naOnly('5.2', 1, TABLE),
  ...naOnly('5.3', 1, TABLE),
  ...naOnly('5.4', 1, TABLE),
  ...naOnly('5.5', 1, TABLE),
  ...naOnly('5.6', 4, TABLE),

  // 5.7 : trois des cinq tests ont une règle axe fiable, utilisée en détection
  // d'échec seulement — elles ne couvrent pas les en-têtes complexes.
  {
    testId: '5.7.1',
    criterionId: '5.7',
    axeRules: ['th-has-data-cells'],
    naWhen: TABLE,
    provesPass: false,
  },
  {
    testId: '5.7.2',
    criterionId: '5.7',
    axeRules: ['scope-attr-valid'],
    naWhen: TABLE,
    provesPass: false,
  },
  { testId: '5.7.3', criterionId: '5.7', naWhen: TABLE, provesPass: false },
  {
    testId: '5.7.4',
    criterionId: '5.7',
    axeRules: ['td-headers-attr'],
    naWhen: TABLE,
    provesPass: false,
  },
  { testId: '5.7.5', criterionId: '5.7', naWhen: TABLE, provesPass: false },

  // 5.8 : un tableau explicitement déclaré de mise en forme — `role` de
  // présentation — qui porte malgré tout des balises de tableau de données est
  // un contre-exemple indiscutable, sans qu'aucun jugement soit requis.
  {
    testId: '5.8.1',
    criterionId: '5.8',
    failWhen: [
      'table[role="presentation"] caption',
      'table[role="presentation"] th',
      'table[role="presentation"] thead',
      'table[role="presentation"] tfoot',
      'table[role="none"] caption',
      'table[role="none"] th',
      'table[role="none"] thead',
      'table[role="none"] tfoot',
    ].join(', '),
    naWhen: TABLE,
    provesPass: false,
  },

  // — 6.2 Intitulé de lien ————————————————————————————————————————————————
  // Le test exige un intitulé « entre `<a>` et `</a>` » : `link-name` d'axe
  // accepterait un `aria-label` seul, que le RGAA refuse. Le sélecteur ne
  // retient que le cas certain, un lien strictement vide. Sans `naWhen` : une
  // page sans lien reste à évaluer plutôt que d'être déclarée sans objet.
  { testId: '6.2.1', criterionId: '6.2', failWhen: 'a[href]:empty', provesPass: false },

  // — 8.3 Langue par défaut ————————————————————————————————————————————————
  // La validité du code de langue relève du critère 8.4 : sa présence suffit
  // donc à prouver le succès de ce test-ci.
  {
    testId: '8.3.1',
    criterionId: '8.3',
    failWhen: 'html:not([lang]), html[lang=""]',
    mainFrameOnly: true,
    provesPass: true,
  },

  // — 8.5 Titre de page ————————————————————————————————————————————————————
  // La pertinence du titre est le critère 8.6. Ici, seule sa présence compte.
  {
    testId: '8.5.1',
    criterionId: '8.5',
    failWhen: 'head:not(:has(title)), title:empty',
    mainFrameOnly: true,
    provesPass: true,
  },

  // — 8.9 Balises de présentation ——————————————————————————————————————————
  { testId: '8.9.1', criterionId: '8.9', failWhen: PRESENTATION_TAGS, provesPass: false },

  // — 9.1 Structuration par les titres ————————————————————————————————————
  // `heading-order` détecte un saut de niveau, qui rompt objectivement la
  // hiérarchie. La pertinence du contenu des titres — tests 9.1.2 et 9.1.3 —
  // n'est pas de son ressort, ni du nôtre.
  { testId: '9.1.1', criterionId: '9.1', axeRules: ['heading-order'], provesPass: false },

  // — 10.1 Feuilles de styles ——————————————————————————————————————————————
  { testId: '10.1.1', criterionId: '10.1', failWhen: PRESENTATION_TAGS, provesPass: false },
  { testId: '10.1.2', criterionId: '10.1', failWhen: PRESENTATION_ATTRS, provesPass: false },

  // — 11.1 Étiquette de champ ——————————————————————————————————————————————
  // La règle `label` d'axe couvre les mêmes conditions que le test 11.1.1. Elle
  // sert à détecter l'échec ; la pertinence de l'étiquette est le critère 11.2.
  {
    testId: '11.1.1',
    criterionId: '11.1',
    axeRules: ['label'],
    naWhen: FIELD,
    provesPass: false,
  },
  { testId: '11.1.2', criterionId: '11.1', naWhen: FIELD, provesPass: false },
  { testId: '11.1.3', criterionId: '11.1', naWhen: FIELD, provesPass: false },

  // — 11.5 Regroupement des champs de même nature ——————————————————————————
  // Le « si nécessaire » du test est un jugement. Seul le non applicable se
  // conclut ici.
  ...naOnly('11.5', 1, FIELD),
];

/** Les critères que le mapping couvre. */
export const MAPPED_CRITERIA: string[] = [
  ...new Set(RGAA_MAPPING.map(mapping => mapping.criterionId)),
];

/** Sélecteurs de support, à compter sur chaque page. */
export const NA_SELECTORS: string[] = [
  ...new Set(RGAA_MAPPING.flatMap(mapping => mapping.naWhen ?? [])),
];

/** Sélecteurs de contre-exemple, à collecter dans tous les cadres. */
export const FAIL_SELECTORS: string[] = [
  ...new Set(
    RGAA_MAPPING.filter(mapping => !mapping.mainFrameOnly).flatMap(mapping => mapping.failWhen ?? []),
  ),
];

/** Sélecteurs de contre-exemple à ne chercher que dans le document principal. */
export const MAIN_FRAME_FAIL_SELECTORS: string[] = [
  ...new Set(
    RGAA_MAPPING.filter(mapping => mapping.mainFrameOnly).flatMap(mapping => mapping.failWhen ?? []),
  ),
];

/** Les règles axe dont le scan a besoin. Rien d'autre ne sera exécuté. */
export const AXE_RULES: string[] = [
  ...new Set(RGAA_MAPPING.flatMap(mapping => mapping.axeRules ?? [])),
];
