import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { listenToExtensionProbe } from './scan/bridgeProbe.ts'

// Pic T-0063 : sans effet hors développement, retiré avec le pic.
listenToExtensionProbe()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
