import React from 'react';

import {MENTION_SOURCE} from './mention-pattern';
import styles from './mention-text.module.css';

interface MentionTextProps {
  text: string;
}

const MENTION_PATTERN = new RegExp(MENTION_SOURCE, 'gu');

export const MentionText: React.FunctionComponent<MentionTextProps> = ({text}) => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match = MENTION_PATTERN.exec(text);
  while (match) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className={styles.mention}>{match[0]}</span>
    );
    lastIndex = match.index + match[0].length;
    match = MENTION_PATTERN.exec(text);
  }
  MENTION_PATTERN.lastIndex = 0;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
};
