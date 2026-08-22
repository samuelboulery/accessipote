// Imports avec extension `.ts` : ce dossier est aussi exécuté par Node.

/**
 * Ce qu'un `robots.txt` dit au robot anonyme.
 *
 * Seul le groupe `User-agent: *` est retenu : le crawl d'Accessipote ne se
 * déclare sous aucun nom, et n'a donc droit qu'aux règles de tout le monde.
 */
export interface RobotsRules {
  allow: string[];
  disallow: string[];
}

/**
 * Lit un `robots.txt`, en ne gardant que ce qui nous concerne.
 *
 * Volontairement littéral : un fichier illisible ou vide rend des règles vides,
 * ce qui laisse passer. La prudence est ailleurs — dans les limites du crawl et
 * dans la règle de même origine, qui ne dépendent d'aucun fichier distant.
 */
export function parseRobots(text: string): RobotsRules {
  const rules: RobotsRules = { allow: [], disallow: [] };
  let concerned = false;
  let inGroup = false;

  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0].trim();
    if (line === '') continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'user-agent') {
      // Un nouveau groupe commence : les agents s'empilent jusqu'à la première règle.
      if (inGroup) concerned = false;
      inGroup = false;
      if (value === '*') concerned = true;
      continue;
    }

    if (field !== 'allow' && field !== 'disallow') continue;
    inGroup = true;
    if (!concerned || value === '') continue;
    rules[field].push(value);
  }

  return rules;
}

/** Un motif de `robots.txt` : `*` vaut n'importe quoi, `$` ancre la fin. */
function matches(pattern: string, path: string): boolean {
  const source = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\\\$$/, '$');
  return new RegExp(`^${source}`).test(path);
}

/** Longueur du motif le plus précis qui s'applique — 0 si aucun. */
function reach(patterns: string[], path: string): number {
  return patterns
    .filter(pattern => matches(pattern, path))
    .reduce((longest, pattern) => Math.max(longest, pattern.length), 0);
}

/**
 * La règle standard : le motif le plus long l'emporte, et l'égalité profite à
 * l'autorisation.
 */
export function isAllowed(rules: RobotsRules, path: string): boolean {
  const blocked = reach(rules.disallow, path);
  return blocked === 0 || reach(rules.allow, path) >= blocked;
}
