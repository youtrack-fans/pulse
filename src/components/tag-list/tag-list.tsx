import React from 'react';

import type {ArticleTag} from '../../data/types';
import {Badge} from '../badge/badge';

import styles from './tag-list.module.css';

interface TagListProps {
  tags: readonly ArticleTag[];
}

export const TagList: React.FunctionComponent<TagListProps> = ({tags}) => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={styles.tags}>
      {tags.map(tag => (
        <Badge key={tag.id}>{tag.name}</Badge>
      ))}
    </div>
  );
};
