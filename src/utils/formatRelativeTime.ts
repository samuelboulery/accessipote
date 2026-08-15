const DIVISIONS: Array<{ seconds: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { seconds: 60, unit: 'second' },
  { seconds: 3600, unit: 'minute' },
  { seconds: 86400, unit: 'hour' },
  { seconds: 604800, unit: 'day' },
  { seconds: 2629800, unit: 'week' },
  { seconds: 31557600, unit: 'month' },
  { seconds: Infinity, unit: 'year' },
];

const formatters = {
  long: new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }),
  short: new Intl.RelativeTimeFormat('fr', { numeric: 'auto', style: 'short' }),
};

/**
 * « il y a 2 minutes », ou « il y a 2 min » en style court — utile là où la
 * place est comptée, comme la colonne de 244px. Renvoie une chaîne vide si la
 * date est illisible.
 */
export function formatRelativeTime(
  isoDate: string,
  now: Date = new Date(),
  style: 'long' | 'short' = 'long',
): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return '';

  const elapsed = (timestamp - now.getTime()) / 1000;
  const absolute = Math.abs(elapsed);

  let previous = 1;
  for (const { seconds, unit } of DIVISIONS) {
    if (absolute < seconds) {
      return formatters[style].format(Math.round(elapsed / previous), unit);
    }
    previous = seconds;
  }
  return '';
}
