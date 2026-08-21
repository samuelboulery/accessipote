/**
 * Pic T-0063 — jetable, développement seulement.
 *
 * Prouve qu'un message posté par le content script d'une extension arrive dans
 * l'app malgré sa CSP stricte. La vraie porte d'entrée — validation d'origine,
 * puis `parseScanReport` — est le ticket T-0067 ; celle-ci ne valide rien et
 * n'écrit rien.
 */
import { logWarning } from '../utils/logger';

export function listenToExtensionProbe(): void {
  if (!import.meta.env.DEV) return;

  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.source !== 'accessipote-extension') return;

    // Constatable sans ouvrir les outils de développement.
    document.title = '✅ pic T-0063 — message reçu';
    logWarning('[pic T-0063] message reçu de l’extension', event.data.charge);
  });
}
