import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En développement, Vite injecte le CSS Tailwind via des <style> (HMR).
// Les meta tags CSP et les HTTP headers s'appliquent en mode AND — il faut
// modifier le meta tag lui-même en dev pour autoriser 'unsafe-inline'.
// En production (vite build), le CSS est compilé en fichier statique : CSP stricte.
function devCspPlugin(): Plugin {
  return {
    name: 'dev-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.server) return html;
        return html
          .replace("style-src 'self';", "style-src 'self' 'unsafe-inline';")
          .replace("script-src 'self';", "script-src 'self' 'unsafe-inline';")
          .replace("connect-src 'self';", "connect-src 'self' ws://localhost:*;");
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devCspPlugin()],
  build: {
    rollupOptions: {
      output: {
        // Séparer les vendor libraries pour optimiser le cache. Rollup 5, qui
        // arrive avec Vite 8, n'accepte plus la forme objet : le découpage se
        // déclare par une fonction qui reçoit le chemin de chaque module.
        //
        // jsPDF n'y figure volontairement pas. Le nommer en chunk manuel le
        // rendait joignable depuis l'entrée, donc listé en `modulepreload` :
        // les 234 ko de la chaîne PDF étaient téléchargés au chargement de la
        // page, ce qui annulait l'import dynamique de ExportButton. Laissé à
        // Rollup, cet import produit un chunk asynchrone, chargé à l'export.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'ui-vendor';
          if (/[\\/]node_modules[\\/]dompurify[\\/]/.test(id)) return 'dompurify-vendor';
        },
      },
    },
    // Activer la minification
    minify: 'terser',
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
})
