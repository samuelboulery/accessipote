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

// Supports d'image, un par balise : le référentiel écrit un test par balise,
// et l'absence de l'une ne dit rien de l'autre.
const IMG = 'img, [role="img"]';
const AREA = 'area';
const INPUT_IMAGE = 'input[type="image"]';
const OBJECT_IMAGE = 'object[type^="image/"]';
const EMBED_IMAGE = 'embed[type^="image/"]';
const SVG = 'svg';
const CANVAS = 'canvas';
/** Toute image, quelle que soit sa balise — pour les tests qui les visent en bloc. */
const ANY_IMAGE = [IMG, AREA, INPUT_IMAGE, OBJECT_IMAGE, EMBED_IMAGE, SVG, CANVAS].join(', ');

/**
 * Boutons de formulaire, au sens du glossaire RGAA : trois formes HTML et le
 * rôle WAI-ARIA. Le bouton n'est pas un champ de saisie — le thème 11 les
 * traite séparément, et leur absence n'écarte pas les mêmes critères.
 */
const BUTTON = [
  'button',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="button"]',
  'input[type="image"]',
  '[role="button"]',
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

/**
 * Comme `naOnly`, pour un support qui peut n'apparaître qu'après une
 * interaction — un champ derrière un onglet déplié, une connexion, un clic.
 *
 * `except` laisse de côté les tests écrits à la main juste à côté : ils portent
 * une règle axe en plus du support, et se déclarent en toutes lettres.
 */
function volatileNaOnly(
  criterionId: string,
  count: number,
  naWhen: string,
  except: string[] = [],
): RgaaMapping[] {
  return volatileNaBySupport(criterionId, Array.from({ length: count }, () => naWhen), except);
}

/**
 * Comme `volatileNaOnly`, mais un support par test.
 *
 * Le thème 1 écrit un test par balise — `<img>`, `<object>`, `<svg>`… — et
 * l'absence de l'une ne dit rien de l'autre. Le rang dans la liste est le
 * numéro du test.
 */
function volatileNaBySupport(
  criterionId: string,
  supports: string[],
  except: string[] = [],
): RgaaMapping[] {
  return supports
    .map((naWhen, index) => ({
      testId: `${criterionId}.${index + 1}`,
      criterionId,
      naWhen,
      volatileSupport: true as const,
      provesPass: false,
    }))
    .filter(mapping => !except.includes(mapping.testId));
}

export const RGAA_MAPPING: RgaaMapping[] = [
  // — Thème 1 Images ——————————————————————————————————————————————————————
  // Le support d'image est volatil : galerie chargée au défilement, visuel
  // derrière un onglet. Aucun non applicable du thème ne s'écrit donc seul.
  //
  // 1.1 — aucun test ne prouve le succès : l'absence d'attribut `alt` est un
  // échec certain, mais sa présence ne dit rien de la pertinence de son
  // contenu — c'est le critère 1.3, et c'est du ressort de l'auditeur.
  // `image-alt` n'est pas cité : le sélecteur ci-dessous dit déjà, et plus
  // littéralement, ce que le test demande.
  {
    testId: '1.1.1',
    criterionId: '1.1',
    failWhen: 'img:not([alt])',
    // Une balise `role="img"` sans nom accessible n'a aucune alternative, quel
    // que soit le chemin retenu par le référentiel.
    axeRules: ['role-img-alt'],
    naWhen: IMG,
    volatileSupport: true,
    provesPass: false,
  },
  {
    testId: '1.1.2',
    criterionId: '1.1',
    failWhen: 'area[href]:not([alt])',
    axeRules: ['area-alt'],
    naWhen: 'area[href]',
    volatileSupport: true,
    provesPass: false,
  },
  {
    testId: '1.1.3',
    criterionId: '1.1',
    failWhen: 'input[type="image"]:not([alt])',
    axeRules: ['input-image-alt'],
    naWhen: INPUT_IMAGE,
    volatileSupport: true,
    provesPass: false,
  },
  { testId: '1.1.4', criterionId: '1.1', naWhen: 'img[ismap]', volatileSupport: true, provesPass: false },
  // Un `<svg>` sans rôle, sans nom accessible et non masqué est un défaut dans
  // les deux branches — image porteuse sans alternative (1.1.5), ou image de
  // décoration mal marquée (1.2.4) — mais la machine ne sait pas laquelle.
  // C'est la définition même d'un indice. `svg-img-alt`, lui, ne vise que le
  // `<svg role="img">` sans alternative : exactement les deux conditions du test.
  {
    testId: '1.1.5',
    criterionId: '1.1',
    axeRules: ['svg-img-alt'],
    probableWhen: 'svg:not([role="img"]):not([aria-hidden="true"]):not([aria-label]):not(:has(title))',
    naWhen: SVG,
    volatileSupport: true,
    provesPass: false,
  },
  // `object-alt` vise tous les `<object>` ; le test ne vise que ceux qui portent
  // une image, le reste relevant du thème 4. La règle déborde : elle alerte.
  {
    testId: '1.1.6',
    criterionId: '1.1',
    probableRules: ['object-alt'],
    naWhen: OBJECT_IMAGE,
    volatileSupport: true,
    provesPass: false,
  },
  { testId: '1.1.7', criterionId: '1.1', naWhen: EMBED_IMAGE, volatileSupport: true, provesPass: false },
  { testId: '1.1.8', criterionId: '1.1', naWhen: CANVAS, volatileSupport: true, provesPass: false },

  // 1.2 — l'image de décoration. Savoir qu'une image est décorative est un acte
  // d'auditeur : rien ici ne s'écrit, et les deux règles retenues ne font que
  // désigner des images dont le marquage sent le défaut.
  {
    testId: '1.2.1',
    criterionId: '1.2',
    probableRules: ['image-redundant-alt', 'presentation-role-conflict'],
    naWhen: 'img',
    volatileSupport: true,
    provesPass: false,
  },
  ...volatileNaBySupport(
    '1.2',
    ['img', 'area:not([href])', OBJECT_IMAGE, SVG, CANVAS, EMBED_IMAGE],
    ['1.2.1'],
  ),

  // 1.3 n'est pas mappé, pas même pour le non applicable : la pertinence d'une
  // alternative est le cœur du travail de l'auditeur, et lui laisser le critère
  // entier vaut mieux que de le lui rendre à moitié préjugé.

  // 1.4 et 1.5 — CAPTCHA. Reconnaître un CAPTCHA suppose de comprendre à quoi
  // sert l'image ; seule son absence se constate.
  ...volatileNaBySupport('1.4', [IMG, AREA, INPUT_IMAGE, OBJECT_IMAGE, EMBED_IMAGE, SVG, CANVAS]),
  ...volatileNaBySupport('1.5', [ANY_IMAGE, INPUT_IMAGE]),

  // 1.6 à 1.8 — description détaillée, pertinence de cette description, image
  // texte. Trois fois un « si nécessaire » ou un jugement sur le contenu.
  ...volatileNaBySupport('1.6', [
    'img',
    OBJECT_IMAGE,
    'embed',
    INPUT_IMAGE,
    SVG,
    SVG,
    CANVAS,
    CANVAS,
    ANY_IMAGE,
    '[role="img"]',
  ]),
  ...volatileNaBySupport('1.7', ['img', INPUT_IMAGE, OBJECT_IMAGE, EMBED_IMAGE, SVG, CANVAS]),
  ...volatileNaBySupport('1.8', [IMG, INPUT_IMAGE, OBJECT_IMAGE, EMBED_IMAGE, CANVAS, SVG]),

  // 1.9 — la légende d'image. Le lien entre une image et sa légende adjacente
  // se juge à l'œil ; l'absence d'image, elle, se compte.
  ...volatileNaBySupport('1.9', [
    'img, input[type="image"], [role="img"]',
    OBJECT_IMAGE,
    'embed',
    SVG,
    CANVAS,
  ]),

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
  // 2.2 : pertinence du titre de cadre. Hors de portée d'une machine — mais
  // deux cadres au même titre rendent l'impertinence probable : au moins l'un
  // des deux ne décrit pas ce qu'il contient.
  {
    testId: '2.2.1',
    criterionId: '2.2',
    probableRules: ['frame-title-unique'],
    naWhen: FRAME,
    provesPass: false,
  },

  // — 3.2 Contraste du texte ——————————————————————————————————————————————
  // `color-contrast` ne connaît ni les cas particuliers du RGAA — texte
  // décoratif, logo, texte dans une image — ni la répartition des tests par
  // taille et par graisse : la sonde ne remonte ni l'une ni l'autre. Aucun test
  // n'est donc désigné, et les quatre passent ensemble à « à vérifier ». Dire
  // lequel des quatre serait une invention.
  ...['1', '2', '3', '4'].map(numero => ({
    testId: `3.2.${numero}`,
    criterionId: '3.2',
    probableRules: ['color-contrast'],
    provesPass: false,
  })),

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
  // `link-name` accepte un `aria-label` seul, que le RGAA refuse, et connaît des
  // exceptions qu'il ignore : sa violation alerte, le sélecteur prouve.
  {
    testId: '6.2.1',
    criterionId: '6.2',
    failWhen: 'a[href]:empty',
    probableRules: ['link-name'],
    provesPass: false,
  },

  // — 8.2 Validité du code source ——————————————————————————————————————————
  // Le test énumère cinq conditions, dont « les valeurs d'attribut id sont
  // uniques dans la page ». `duplicate-id-aria` ne couvre que les identifiants
  // référencés par ARIA ou par un `<label>` : un sous-ensemble, dont la
  // violation dirait l'échec du test. Ses deux voisines, `duplicate-id` et
  // `duplicate-id-active`, sont dépréciées et désactivées dans axe 4.13 — les
  // citer donnerait une couverture qui ne s'exécute pas.
  //
  // ponytail: indice et non preuve, parce que les résultats d'axe sont fusionnés
  // tous cadres confondus : un `id` dupliqué dans un `<iframe>` appartient au
  // document embarqué, pas à la page. Passer à la preuve demande des résultats
  // axe rattachés à leur cadre, comme `mainFrameOnly` le fait déjà pour les
  // sélecteurs.
  {
    testId: '8.2.1',
    criterionId: '8.2',
    probableRules: ['duplicate-id-aria'],
    provesPass: false,
  },

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

  // — 8.4 Validité du code de langue par défaut ————————————————————————————
  // Le test demande un code valide *et* pertinent. `html-lang-valid` tranche la
  // première condition, et l'échec d'une condition suffit à faire échouer le
  // test ; la pertinence, elle, reste à l'auditeur — d'où l'absence de
  // `provesPass`. Un `lang` et un `xml:lang` qui divergent disent que l'un des
  // deux est faux sans dire lequel : c'est un indice.
  {
    testId: '8.4.1',
    criterionId: '8.4',
    axeRules: ['html-lang-valid'],
    probableRules: ['html-xml-lang-mismatch'],
    provesPass: false,
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

  // — 8.8 Code de langue des changements de langue ——————————————————————————
  // `valid-lang` vérifie la validité des `lang` posés sur les éléments, ce que
  // le test demande mot pour mot. Reconnaître un changement de langue *non
  // signalé* — le critère 8.7 — suppose de lire le texte : ce critère reste
  // entier à l'auditeur, et n'est pas mappé.
  { testId: '8.8.1', criterionId: '8.8', axeRules: ['valid-lang'], provesPass: false },

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

  // — Thème 11 Formulaires ————————————————————————————————————————————————
  // Le plus gros gisement du référentiel : treize critères qu'une page sans
  // champ écarte d'un coup. Mais le champ est un support volatil — mesuré sur
  // Accessipote : zéro au chargement, quatorze après trois clics. Tous les non
  // applicables de ce thème restent donc à vérifier par l'auditeur.
  //
  // 11.1 — la règle `label` couvre les mêmes conditions que le test 11.1.1, et
  // `select-name` fait de même pour les listes de choix : les deux acceptent
  // exactement les quatre sources d'étiquette du glossaire. La pertinence de
  // l'étiquette est le critère 11.2, hors de portée d'une machine.
  {
    testId: '11.1.1',
    criterionId: '11.1',
    axeRules: ['label', 'select-name'],
    naWhen: FIELD,
    volatileSupport: true,
    provesPass: false,
  },
  ...volatileNaOnly('11.1', 3, FIELD, ['11.1.1', '11.1.3']),
  // `label-title-only` refuse par principe l'étiquette portée par le seul
  // `title` ; le RGAA l'admet, à condition que son contenu soit compréhensible.
  // La règle déborde donc le test : elle montre où regarder, elle ne tranche pas.
  {
    testId: '11.1.3',
    criterionId: '11.1',
    probableRules: ['label-title-only'],
    naWhen: FIELD,
    volatileSupport: true,
    provesPass: false,
  },

  // 11.2 — pertinence des étiquettes, affaire de jugement. Deux étiquettes sur
  // un même champ ne prouvent pas l'impertinence, mais rendent indécidable ce
  // qui sera restitué : c'est un indice, pas un constat.
  {
    testId: '11.2.1',
    criterionId: '11.2',
    probableRules: ['form-field-multiple-labels'],
    naWhen: FIELD,
    volatileSupport: true,
    provesPass: false,
  },
  ...volatileNaOnly('11.2', 6, FIELD, ['11.2.1']),

  ...volatileNaOnly('11.3', 2, FIELD),
  ...volatileNaOnly('11.4', 3, FIELD),
  ...volatileNaOnly('11.5', 1, FIELD),
  ...volatileNaOnly('11.6', 1, FIELD),
  ...volatileNaOnly('11.7', 1, FIELD),
  ...volatileNaOnly('11.8', 3, FIELD),

  // 11.9 — l'intitulé du bouton. Les six sources admises par le glossaire sont
  // exactement celles qu'`axe` accepte : une violation dit qu'il n'y a aucun
  // intitulé, ce qu'aucune lecture du test ne sauve. Le support est le bouton,
  // pas le champ de saisie : les deux s'absentent séparément.
  {
    testId: '11.9.1',
    criterionId: '11.9',
    axeRules: ['button-name', 'input-button-name'],
    naWhen: BUTTON,
    volatileSupport: true,
    provesPass: false,
  },
  ...volatileNaOnly('11.9', 2, BUTTON, ['11.9.1']),

  // 11.10 à 11.12 — contrôle de saisie, suggestions de correction, confirmation
  // avant action irréversible. Tout y est conditionnel (« si nécessaire ») ou
  // suppose de valider un formulaire : rien qu'une machine ne constate.
  ...volatileNaOnly('11.10', 7, FIELD),
  ...volatileNaOnly('11.11', 2, FIELD),
  ...volatileNaOnly('11.12', 2, FIELD),

  // 11.13 — `autocomplete-valid` vérifie que la valeur figure dans la liste des
  // valeurs admises, ce que le test demande mot pour mot. Son absence, elle,
  // reste au jugement : la machine ne sait pas si le champ se rapporte à
  // l'utilisateur.
  {
    testId: '11.13.1',
    criterionId: '11.13',
    axeRules: ['autocomplete-valid'],
    naWhen: FIELD,
    volatileSupport: true,
    provesPass: false,
  },
];

/** Les critères que le mapping couvre. */
export const MAPPED_CRITERIA: string[] = [
  ...new Set(RGAA_MAPPING.map(mapping => mapping.criterionId)),
];

/** Sélecteurs de support, à compter sur chaque page. */
export const NA_SELECTORS: string[] = [
  ...new Set(RGAA_MAPPING.flatMap(mapping => mapping.naWhen ?? [])),
];

/**
 * Sélecteurs à récolter dans tous les cadres.
 *
 * Contre-exemples et indices sont récoltés de la même façon — ce qui les
 * distingue est le verdict qu'ils produisent, pas la façon de les trouver.
 */
export const FOUND_SELECTORS: string[] = [
  ...new Set(
    RGAA_MAPPING.filter(mapping => !mapping.mainFrameOnly).flatMap(mapping => [
      ...(mapping.failWhen ?? []),
      ...(mapping.probableWhen ?? []),
    ]),
  ),
];

/** Sélecteurs de contre-exemple à ne chercher que dans le document principal. */
export const MAIN_FRAME_FAIL_SELECTORS: string[] = [
  ...new Set(
    RGAA_MAPPING.filter(mapping => mapping.mainFrameOnly).flatMap(mapping => mapping.failWhen ?? []),
  ),
];

/** Les règles axe dont le scan a besoin — preuves et indices. Rien d'autre ne sera exécuté. */
export const AXE_RULES: string[] = [
  ...new Set(
    RGAA_MAPPING.flatMap(mapping => [...(mapping.axeRules ?? []), ...(mapping.probableRules ?? [])]),
  ),
];
