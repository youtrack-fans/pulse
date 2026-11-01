import React from 'react';

import {findMatches} from './match-ranges';

import styles from './search-palette.module.css';

interface HighlightProps {
  text: string;
  query: string;
}

export const Highlight: React.FunctionComponent<HighlightProps> = ({text, query}) => {
  const ranges = findMatches(text, query);
  if (ranges.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let from = 0;
  ranges.forEach(({start, end}) => {
    if (start > from) {
      parts.push(text.slice(from, start));
    }
    parts.push(
      <mark key={start} className={styles.mark}>
        {text.slice(start, end)}
      </mark>,
    );
    from = end;
  });
  parts.push(text.slice(from));

  return parts;
};

export function snippetAround(text: string, query: string, radius: number = 90): string {
  const first = findMatches(text, query)[0];
  if (!first) {
    return text.length > radius * 2 ? `${text.slice(0, radius * 2)}…` : text;
  }
  const start = Math.max(0, first.start - radius);
  const end = Math.min(text.length, first.end + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
