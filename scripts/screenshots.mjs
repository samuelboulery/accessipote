import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

/**
 * Regénère les captures du README (`docs/screenshots/`) et son parcours animé
 * (`docs/parcours.gif`, ffmpeg requis). Trois temps :
 *
 * 1. Le vrai moteur de scan (`src/scripts/scan.ts`) passe sur une page de
 *    démonstration servie en local, truffée d'erreurs connues — le rapport
 *    importé à l'écran est donc un vrai rapport, pas un JSON écrit à la main.
 * 2. Playwright capture l'application sur trois audits de démonstration, à une
 *    date figée : « il y a 8 min » reste « il y a 8 min ».
 * 3. screenmat (https://github.com/samuelboulery/screenmat) encadre chaque
 *    capture : fenêtre de navigateur, fond `mesh` à palette figée, même graine,
 *    donc un rendu identique d'une fois sur l'autre.
 *
 *   pnpm exec playwright install chromium                   # une fois
 *   pnpm dev                                                # dans un autre terminal
 *   SCREENMAT=../screenmat node scripts/screenshots.mjs
 *
 * Sans SCREENMAT, seules les captures brutes sont écrites (dossier temporaire).
 *
 * ponytail: un script qui ouvre un navigateur, clique et écrit des fichiers —
 * pas de reporter ni de fixture Playwright.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = mkdtempSync(join(tmpdir(), 'accessipote-shots-')) + '/';
const ROOT = new URL('../', import.meta.url).pathname;
const DOCS = join(ROOT, 'docs/screenshots/');
const NOW = new Date('2026-10-01T10:00:00+02:00');
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
// Les jetons du design : vert conforme, rouge écart, bleu RGAA.
const PALETTE = { base: '#0f1a14', accents: ['#0f5c37', '#428ac2', '#b3261e'] };

/* --- 1. Un vrai rapport de scan, sur une page faite pour échouer --------- */

const DEMO_PAGE = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
  <header><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="120" height="40"></header>
  <main>
    <div style="font-size:2em;font-weight:bold">Nos offres</div>
    <p>Comparez nos formules, puis <a href="#contact">cliquez ici</a>.</p>
    <iframe src="about:blank"></iframe>
    <form>
      <input type="text" name="nom" placeholder="Votre nom">
      <input type="email" name="courriel" id="courriel" lang="zz">
      <button></button>
    </form>
    <p id="dup">Une</p><p id="dup">Deux</p>
  </main>
</body></html>`;

const server = createServer((request, response) => {
  if (request.url === '/robots.txt') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(DEMO_PAGE);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const demoUrl = `http://127.0.0.1:${server.address().port}/`;
const reportPath = join(OUT, 'rapport-scan.json');
// Asynchrone, et non `execFileSync` : le serveur de la page vit dans ce même
// processus, il doit pouvoir répondre pendant que le scan l'interroge.
try {
  await promisify(execFile)(process.execPath, ['src/scripts/scan.ts', '-o', reportPath, demoUrl], {
    cwd: ROOT,
  });
} finally {
  server.close();
}
// Le port change à chaque passe, la date aussi : on les fige pour que deux
// passes donnent la même image.
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const stable = JSON.stringify({ ...report, scannedAt: NOW.toISOString() })
  .replaceAll(demoUrl, 'https://vitrine.exemple/');
writeFileSync(reportPath, stable);

/* --- 2. Les audits de démonstration -------------------------------------- */

const criteria = JSON.parse(readFileSync(join(ROOT, 'src/data/criteria.json'), 'utf8'));
const ids = criteria.topics.flatMap(topic =>
  topic.criteria.map(({ criterium }) => `${topic.number}.${criterium.number}`),
);

/** Générateur pseudo-aléatoire à graine : même graine, mêmes statuts. */
function random(seed) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

/** Remplit `share` des critères, avec des statuts tirés selon `weights`. */
function progressOf(seed, share, weights) {
  const draw = random(seed);
  const entries = ids
    .filter(() => draw() < share)
    .map(id => {
      const roll = draw();
      let sum = 0;
      const [status] = weights.find(([, weight]) => (sum += weight) > roll) ?? weights.at(-1);
      return [id, { status }];
    });
  return Object.fromEntries(entries);
}

const at = offset => new Date(NOW.getTime() - offset).toISOString();

const vitrine = {
  id: 'demo-vitrine',
  name: 'Site vitrine — refonte 2026',
  scope: 'Accueil, offres, contact, mentions légales',
  mode: 'classic',
  themes: [],
  createdAt: at(12 * DAY),
  updatedAt: at(8 * MINUTE),
  progress: {
    ...progressOf(7, 0.86, [['conforme', 0.58], ['non-conforme', 0.22], ['non-applicable', 0.2]]),
    '6.1': { status: 'conforme' },
    '6.2': { status: 'non-conforme' },
  },
  notes: {
    '6.2':
      'Le logo cliquable de l’en-tête est une image sans alternative : le lien n’a aucun intitulé. Ajouter `alt="Accueil — Vitrine"`.',
  },
  pages: { '6.2': ['https://vitrine.exemple/', 'https://vitrine.exemple/contact'] },
  checkedTests: { '6.2': ['1'] },
};

const designSystem = {
  id: 'demo-ds',
  name: 'Design system Hêtre',
  scope: 'Bibliothèque de composants v4',
  mode: 'design-system',
  themes: [],
  createdAt: at(30 * DAY),
  updatedAt: at(2 * DAY),
  progress: progressOf(
    11,
    0.55,
    [['default-compliant', 0.55], ['project-implementation', 0.3], ['non-applicable', 0.15]],
  ),
  notes: {},
  pages: {},
  checkedTests: {},
};

const espaceClient = {
  id: 'demo-client',
  name: 'Espace client — v3',
  scope: 'Connexion, tableau de bord, factures',
  mode: 'classic',
  themes: [],
  createdAt: at(3 * DAY),
  updatedAt: at(3 * DAY),
  progress: {},
  notes: {},
  pages: {},
  checkedTests: {},
};

const audits = [vitrine, designSystem, espaceClient];

/* --- 3. Les captures ----------------------------------------------------- */

const browser = await chromium.launch();

async function open({ active = vitrine.id, theme = 'light', viewport } = {}) {
  const page = await browser.newPage({
    viewport: viewport ?? { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: theme,
    reducedMotion: 'reduce',
    locale: 'fr-FR',
  });
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(
    ({ store, theme }) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.clear();
      localStorage.setItem('rgaa-audits', JSON.stringify(store));
      localStorage.setItem('theme', theme);
    },
    { store: { version: 2, audits, activeAuditId: active }, theme },
  );
  await page.goto(BASE);
  await page.getByRole('navigation', { name: 'Navigation principale' }).waitFor();
  return page;
}

const nav = (page, name) =>
  page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name, exact: true }).click();

async function shot(page, name) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log(name);
}

// Accueil
{
  const page = await open();
  await nav(page, 'Accueil');
  await shot(page, 'accueil');
  await page.close();
}

// Audit : un critère déplié, ses tests, son cas particulier, sa note, ses pages
{
  const page = await open();
  await nav(page, 'Audit');
  await page.getByRole('tab', { name: /^Liens/ }).click();
  await page.getByRole('button', { name: 'Voir les tests' }).nth(1).click();
  await shot(page, 'audit');
  await page.close();
}

// Synthèse
{
  const page = await open();
  await nav(page, 'Synthèse');
  await shot(page, 'synthese');
  await page.close();
}

// Import d'un rapport de scan, sur un audit encore vierge
{
  const page = await open({ active: espaceClient.id });
  await nav(page, 'Audit');
  await page.getByRole('button', { name: 'Importer un scan' }).click();
  await page.locator('#scan-report-file').setInputFiles(reportPath);
  await page.getByRole('dialog').getByRole('group').first().waitFor();
  // Le Chromium de Playwright n'embarque que l'anglais : le champ fichier natif
  // afficherait « No file chosen ». On ouvre la revue sur son bilan.
  await page.getByText(/^Rapport importé/).evaluate(node => node.scrollIntoView({ block: 'start' }));
  await shot(page, 'import-scan');
  await page.close();
}

// Gabarit d'export Markdown
{
  const page = await open();
  await nav(page, 'Audit');
  await page.getByRole('button', { name: /Personnaliser l.export Markdown/ }).click();
  await page.getByRole('dialog').waitFor();
  await shot(page, 'gabarit-export');
  await page.close();
}

// Mode sombre
{
  const page = await open({ theme: 'dark' });
  await nav(page, 'Audit');
  await shot(page, 'sombre');
  await page.close();
}

// Parcours du README : créer un audit, noter des critères, lire la synthèse.
// Une image par étape plutôt qu'une vidéo : rendu identique d'une passe à
// l'autre, et un GIF de quelques centaines de Ko.
{
  const frames = join(OUT, 'parcours/');
  mkdirSync(frames);
  let count = 0;
  const frame = async (page, hold = 1) => {
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const shot = await page.screenshot();
    // Une étape qui doit se lire reste affichée plus longtemps : même image répétée.
    for (let i = 0; i < hold; i++) {
      writeFileSync(`${frames}${String(count++).padStart(2, '0')}.png`, shot);
    }
  };
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'fr-FR',
  });
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(store => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('rgaa-audits', JSON.stringify(store));
    localStorage.setItem('theme', 'light');
  }, { version: 2, audits, activeAuditId: vitrine.id });
  await page.goto(BASE);
  await page.getByRole('navigation', { name: 'Navigation principale' }).waitFor();
  await nav(page, 'Accueil');
  await frame(page, 2);

  await page.getByRole('button', { name: 'Nouvel audit' }).click();
  await page.locator('#audit-name').waitFor();
  await frame(page);
  await page.locator('#audit-name').fill('Intranet RH — recette');
  await page.locator('#audit-scope').fill('https://intranet.exemple');
  await frame(page, 2);
  await page.getByRole('button', { name: "Créer l'audit" }).click();
  await page.getByRole('radiogroup', { name: /^Statut du critère 1\.1 / }).waitFor();
  await frame(page, 2);

  const rate = async (id, status) => {
    await page
      .getByRole('radiogroup', { name: new RegExp(`^Statut du critère ${id.replace('.', '\\.')} `) })
      .getByText(status, { exact: true })
      .click();
    await frame(page);
  };
  await rate('1.1', 'Conforme');
  await rate('1.2', 'Non conforme');
  await rate('1.3', 'Non applicable');

  await nav(page, 'Synthèse');
  await frame(page, 4);
  await page.close();

  // Palette calculée sur toutes les images, puis appliquée sans tramage : les
  // aplats de l'interface restent nets et le fichier léger.
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-framerate', '1/0.9', '-i', `${frames}%02d.png`,
    '-vf', 'scale=1000:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=none',
    '-loop', '0', join(ROOT, 'docs/parcours.gif'),
  ]);
  console.log('parcours.gif');
}

await browser.close();

const screenmat = process.env.SCREENMAT;
if (!screenmat) {
  console.log(`Captures brutes dans ${OUT} — SCREENMAT non défini, pas d'encadrement.`);
  process.exit(0);
}

mkdirSync(DOCS, { recursive: true });
for (const file of readdirSync(OUT).filter(name => name.endsWith('.png'))) {
  const name = file.replace(/\.png$/, '');
  const spec = join(OUT, `${name}.json`);
  writeFileSync(spec, JSON.stringify({ palette: PALETTE, shots: [{ input: join(OUT, file) }] }));
  execFileSync(
    'pnpm',
    [
      '-s', 'cli', '--spec', spec,
      '--frame', 'browser', '--url', 'accessipote.fr', '--ratio', 'auto',
      '--background', 'mesh', '--seed', '3', '-o', `${DOCS}${name}.webp`,
    ],
    { cwd: screenmat, stdio: 'inherit' },
  );
}
