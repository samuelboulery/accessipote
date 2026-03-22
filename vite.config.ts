import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

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
  plugins: [react(), devCspPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les vendor libraries pour optimiser le cache
          'react-vendor': ['react', 'react-dom'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          'ui-vendor': ['lucide-react'],
          'dompurify-vendor': ['dompurify'],
        },
      },
    },
    // Activer la minification
    minify: 'terser',
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
})
