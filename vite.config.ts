import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
