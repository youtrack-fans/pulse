export interface MatchRange {
  start: number;
  end: number;
}

const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

export function findMatches(text: string, query: string): MatchRange[] {
  const needle = query.trim();
  if (!needle) {
    return [];
  }
  const pattern = new RegExp(needle.replace(REGEX_SPECIAL, '\\$&'), 'giu');
  return [...text.matchAll(pattern)].map(match => {
    const start = match.index ?? 0;
    return {start, end: start + match[0].length};
  });
}
