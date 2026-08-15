const DIVISIONS: Array<{ seconds: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { seconds: 60, unit: 'second' },
  { seconds: 3600, unit: 'minute' },
  { seconds: 86400, unit: 'hour' },
  { seconds: 604800, unit: 'day' },
  { seconds: 2629800, unit: 'week' },
  { seconds: 31557600, unit: 'month' },
  { seconds: Infinity, unit: 'year' },
];

const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

/** « il y a 2 minutes ». Renvoie une chaîne vide si la date est illisible. */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return '';

  const elapsed = (timestamp - now.getTime()) / 1000;
  const absolute = Math.abs(elapsed);

  let previous = 1;
  for (const { seconds, unit } of DIVISIONS) {
    if (absolute < seconds) {
      return formatter.format(Math.round(elapsed / previous), unit);
    }
    previous = seconds;
  }
  return '';
}
