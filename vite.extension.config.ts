import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);
const OUT_DIR = resolve(import.meta.dirname, 'dist-extension');

/**
 * Le manifest et axe-core ne sont pas des modules : ils se copient.
 *
 * Une dépendance de copie de fichiers pour deux `copyFileSync` serait mal
 * employée. axe est copié tel quel — c'est un fichier de l'extension, chargé
 * par `executeScript` dans le monde isolé de la page.
 *
 * Le manifest source s'appelle `manifest.config.json`, et c'est délibéré :
 * `extension/` doit être impossible à charger dans Chrome par mégarde. Son
 * `popup.html` référence un fichier `.ts` que le navigateur ne sait pas
 * exécuter, et le popup s'ouvrirait inerte, sans rien dire de la cause. Sans
 * `manifest.json`, Chrome refuse le dossier tout net.
 */
function copyAssets(): Plugin {
  return {
    name: 'extension-assets',
    closeBundle() {
      mkdirSync(OUT_DIR, { recursive: true });
      copyFileSync(
        resolve(import.meta.dirname, 'extension/manifest.config.json'),
        resolve(OUT_DIR, 'manifest.json'),
      );
      copyFileSync(require.resolve('axe-core/axe.min.js'), resolve(OUT_DIR, 'axe.min.js'));

      const icons = resolve(import.meta.dirname, 'extension/icons');
      mkdirSync(resolve(OUT_DIR, 'icons'), { recursive: true });
      for (const icon of readdirSync(icons)) {
        copyFileSync(resolve(icons, icon), resolve(OUT_DIR, 'icons', icon));
      }
    },
  };
}

/**
 * Retire l'attribut `crossorigin` des balises générées.
 *
 * Vite le pose pour le déploiement web, où il a un sens. Sur une page
 * `chrome-extension://`, il déclenche une requête CORS que Chrome refuse : le
 * script du popup ne se charge pas, et le popup s'ouvre vide.
 */
function stripCrossorigin(): Plugin {
  return {
    name: 'extension-strip-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(=["'][^"']*["'])?/g, '');
    },
  };
}

/**
 * Build de l'extension, séparé de celui de l'application.
 *
 * Les deux partagent `src/scan/` et rien d'autre : axe-core vit dans
 * l'extension, jamais dans le bundle de l'application.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, 'extension'),
  base: './',
  plugins: [stripCrossorigin(), copyAssets()],
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    target: 'chrome120',
    rollupOptions: {
      input: resolve(import.meta.dirname, 'extension/popup.html'),
    },
  },
});
