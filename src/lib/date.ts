const DATE_LOCALE = 'en-US';
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;

const fullDate = new Intl.DateTimeFormat(DATE_LOCALE, {year: 'numeric', month: 'short', day: 'numeric'});
const shortDate = new Intl.DateTimeFormat(DATE_LOCALE, {month: 'short', day: 'numeric'});

export function formatFullDate(timestamp: number): string {
  return fullDate.format(timestamp);
}

export function formatShortDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / MS_PER_MINUTE);
  const diffHours = Math.floor(diffMs / MS_PER_HOUR);
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffMin < 1) {return 'now';}
  if (diffMin < MINUTES_PER_HOUR) {return `${diffMin}m`;}
  if (diffHours < HOURS_PER_DAY) {return `${diffHours}h`;}
  if (diffDays === 1) {return 'yesterday';}
  if (diffDays < DAYS_PER_WEEK) {return `${diffDays}d`;}

  return shortDate.format(timestamp);
}
