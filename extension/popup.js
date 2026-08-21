/**
 * Pic T-0063 — jetable.
 *
 * Deux questions, deux boutons : combien de cadres un content script atteint
 * sur une page réelle, et un `postMessage` depuis l'extension traverse-t-il la
 * CSP stricte d'Accessipote.
 *
 * Les sélecteurs sont recopiés de `src/scan/rgaaMapping.ts` — un pic ne monte
 * pas de chaîne de build. Le partage réel du mapping est le ticket T-0064.
 */
const SELECTORS = {
  cadres: 'iframe, frame',
  medias: 'video, audio, object, embed, canvas',
  tableaux: 'table',
  champs: 'input:not([type="hidden"]), select, textarea',
  images: 'img, [role="img"]',
};

let dernierScan = null;

const sortie = document.getElementById('out');
const dire = (texte) => { sortie.textContent = texte; };

/** Exécuté dans la page : un appel par cadre. */
function sonder(selecteurs) {
  const comptes = {};
  for (const [nom, selecteur] of Object.entries(selecteurs)) {
    try {
      comptes[nom] = document.querySelectorAll(selecteur).length;
    } catch {
      // Sélecteur non supporté : non renseigné, jamais compté comme zéro.
    }
  }
  return {
    url: location.href,
    origine: location.origin,
    elements: document.querySelectorAll('*').length,
    comptes,
  };
}

document.getElementById('scan').addEventListener('click', async () => {
  dire('Scan en cours…');
  try {
    const [onglet] = await chrome.tabs.query({ active: true, currentWindow: true });
    const resultats = await chrome.scripting.executeScript({
      target: { tabId: onglet.id, allFrames: true },
      func: sonder,
      args: [SELECTORS],
    });

    const cadres = resultats.map((entree) => entree.result).filter(Boolean);
    const origine = new URL(onglet.url).origin;
    const horsOrigine = cadres.filter((cadre) => cadre.origine !== origine).length;

    const total = {};
    for (const nom of Object.keys(SELECTORS)) {
      total[nom] = cadres.reduce((somme, cadre) => somme + (cadre.comptes[nom] ?? 0), 0);
    }

    dernierScan = { url: onglet.url, scanneA: new Date().toISOString(), cadres, total };

    dire(
      `${cadres.length} cadre(s) atteint(s), dont ${horsOrigine} hors origine\n\n` +
        Object.entries(total).map(([nom, n]) => `  ${nom.padEnd(9)} ${n}`).join('\n') +
        '\n\n' +
        cadres.map((cadre) => `  ${String(cadre.elements).padStart(6)} ${cadre.url.slice(0, 60)}`).join('\n'),
    );
  } catch (erreur) {
    dire(`Échec : ${erreur.message}`);
  }
});

document.getElementById('send').addEventListener('click', async () => {
  if (!dernierScan) return dire('Scanner une page d’abord.');

  const onglets = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
  if (onglets.length === 0) return dire('Ouvrir Accessipote sur http://localhost:5173.');

  await chrome.scripting.executeScript({
    target: { tabId: onglets[0].id },
    func: (charge) => window.postMessage({ source: 'accessipote-extension', charge }, location.origin),
    args: [dernierScan],
  });

  dire('Message envoyé. L’onglet Accessipote doit afficher « ✅ pic T-0063 » dans son titre.');
});
