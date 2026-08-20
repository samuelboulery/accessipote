import { useCallback, useState } from 'react';
import type { Mode } from '../types';
import { DEFAULT_TEMPLATES, isValidTemplate } from '../utils/markdownTemplate';
import { EXPORT_TEMPLATES_STORAGE_KEY } from '../constants';

type StoredTemplates = Partial<Record<Mode, string>>;

/**
 * Le gabarit vient de localStorage : une source du dehors, qu'un autre onglet,
 * une extension ou une version précédente du format ont pu écrire. Tout ce qui
 * n'est pas une chaîne valide retombe sur le défaut, en silence — l'utilisateur
 * n'a pas à savoir qu'une clé était corrompue, il a besoin d'un export qui
 * marche.
 */
function readStored(): StoredTemplates {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(EXPORT_TEMPLATES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const source = parsed as Record<string, unknown>;
    const kept: StoredTemplates = {};
    for (const mode of ['classic', 'design-system'] as const) {
      const value = source[mode];
      if (typeof value === 'string' && isValidTemplate(value)) kept[mode] = value;
    }
    return kept;
  } catch {
    return {};
  }
}

function writeStored(next: StoredTemplates) {
  try {
    window.localStorage.setItem(EXPORT_TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota plein ou stockage refusé : le gabarit reste bon pour la session en
    // cours. Perdre la persistance ne justifie pas de casser l'édition.
  }
}

export function useMarkdownTemplate(mode: Mode) {
  const [stored, setStored] = useState<StoredTemplates>(readStored);

  const update = useCallback((next: StoredTemplates) => {
    writeStored(next);
    setStored(next);
  }, []);

  const setTemplate = useCallback(
    (next: string) => update({ ...stored, [mode]: next }),
    [mode, stored, update],
  );

  const reset = useCallback(() => {
    const rest = { ...stored };
    delete rest[mode];
    update(rest);
  }, [mode, stored, update]);

  return { template: stored[mode] ?? DEFAULT_TEMPLATES[mode], setTemplate, reset };
}
