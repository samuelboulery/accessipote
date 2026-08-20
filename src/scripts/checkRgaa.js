/**
 * Script Node.js pour détecter une dérive entre les données RGAA embarquées et
 * le dépôt officiel de la DINUM.
 *
 * Les fichiers `src/data/criteria.json` et `src/data/glossary.json` sont des
 * copies de `RGAA/criteres.json` et `RGAA/glossaire.json` — la **version en
 * vigueur**, à la racine du dossier `RGAA/`. Le sous-dossier `RGAA/4.1/` est
 * une archive figée : s'en servir est précisément l'erreur qui a laissé
 * Accessipote trois ans en retard sur le référentiel.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL =
  'https://raw.githubusercontent.com/DISIC/accessibilite.numerique.gouv.fr/main/RGAA';

const FICHIERS = [
  { local: 'src/data/criteria.json', distant: 'criteres.json' },
  { local: 'src/data/glossary.json', distant: 'glossaire.json' },
];

/**
 * Compare deux valeurs JSON en ignorant l'indentation et l'ordre des clés.
 * @param {unknown} valeur
 * @returns {string}
 */
function normaliser(valeur) {
  if (Array.isArray(valeur)) {
    return `[${valeur.map(normaliser).join(',')}]`;
  }
  if (valeur !== null && typeof valeur === 'object') {
    const entrees = Object.keys(valeur)
      .sort()
      .map((cle) => `${JSON.stringify(cle)}:${normaliser(valeur[cle])}`);
    return `{${entrees.join(',')}}`;
  }
  return JSON.stringify(valeur);
}

/**
 * Liste les identifiants de critères dont le contenu diverge.
 * @param {{ topics: Array<object> }} local
 * @param {{ topics: Array<object> }} distant
 * @returns {string[]}
 */
function criteresDivergents(local, distant) {
  const aplatir = (donnees) => {
    const index = new Map();
    for (const theme of donnees.topics ?? []) {
      for (const { criterium } of theme.criteria ?? []) {
        index.set(`${theme.number}.${criterium.number}`, normaliser(criterium));
      }
    }
    return index;
  };

  const gauche = aplatir(local);
  const droite = aplatir(distant);
  const identifiants = new Set([...gauche.keys(), ...droite.keys()]);

  return [...identifiants]
    .filter((id) => gauche.get(id) !== droite.get(id))
    .sort((a, b) => {
      const [ta, ca] = a.split('.').map(Number);
      const [tb, cb] = b.split('.').map(Number);
      return ta - tb || ca - cb;
    });
}

/**
 * Liste les titres d'entrées de glossaire dont le contenu diverge.
 * @param {{ glossary: Array<{ title: string }> }} local
 * @param {{ glossary: Array<{ title: string }> }} distant
 * @returns {string[]}
 */
function glossaireDivergent(local, distant) {
  const aplatir = (donnees) =>
    new Map((donnees.glossary ?? []).map((entree) => [entree.title, normaliser(entree)]));

  const gauche = aplatir(local);
  const droite = aplatir(distant);
  const titres = new Set([...gauche.keys(), ...droite.keys()]);

  return [...titres].filter((titre) => gauche.get(titre) !== droite.get(titre)).sort();
}

async function verifierRgaa() {
  console.log('=== Contrôle des données RGAA ===\n');
  console.log('Référence :', BASE_URL, '\n');

  const rapports = [];

  for (const fichier of FICHIERS) {
    const url = `${BASE_URL}/${fichier.distant}`;
    const reponse = await fetch(url);

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP ${reponse.status} sur ${url}`);
    }

    const distant = await reponse.json();
    const local = JSON.parse(readFileSync(join(process.cwd(), fichier.local), 'utf-8'));

    const identique = normaliser(local) === normaliser(distant);
    const divergences =
      fichier.distant === 'criteres.json'
        ? criteresDivergents(local, distant)
        : glossaireDivergent(local, distant);

    rapports.push({ fichier, identique, divergences });
  }

  for (const { fichier, identique, divergences } of rapports) {
    if (identique) {
      console.log(`✓ ${fichier.local} — conforme à RGAA/${fichier.distant}`);
      continue;
    }

    const nature = fichier.distant === 'criteres.json' ? 'critère(s)' : 'entrée(s) de glossaire';
    console.log(`✗ ${fichier.local} — dérive par rapport à RGAA/${fichier.distant}`);
    console.log(`  ${divergences.length} ${nature} divergent(s) :`);
    for (const divergence of divergences) {
      console.log(`    - ${divergence}`);
    }
  }

  if (rapports.some((rapport) => !rapport.identique)) {
    console.log('\nRecopier les fichiers officiels depuis RGAA/ (et non RGAA/4.1/).');
    process.exit(1);
  }

  console.log('\nAucune dérive.');
}

verifierRgaa().catch((error) => {
  console.error('Échec du contrôle RGAA:', error);
  process.exit(1);
});
