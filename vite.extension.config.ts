import { copyFileSync, mkdirSync } from 'node:fs';
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
 */
function copyAssets(): Plugin {
  return {
    name: 'extension-assets',
    closeBundle() {
      mkdirSync(OUT_DIR, { recursive: true });
      copyFileSync(resolve(import.meta.dirname, 'extension/manifest.json'), resolve(OUT_DIR, 'manifest.json'));
      copyFileSync(require.resolve('axe-core/axe.min.js'), resolve(OUT_DIR, 'axe.min.js'));
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
  plugins: [copyAssets()],
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    target: 'chrome120',
    rollupOptions: {
      input: resolve(import.meta.dirname, 'extension/popup.html'),
    },
  },
});
