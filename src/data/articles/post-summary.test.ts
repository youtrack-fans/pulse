import {describe, expect, it} from 'vitest';

import type {MagazinePostStub} from '../types';
import {toPostSummaries} from './post-summary';

const stub = (id: string, blogId: string, commentsCount = 0): MagazinePostStub => ({
  id,
  idReadable: `P-${id}`,
  blogId,
  summary: `Post ${id}`,
  created: 1,
  authorLogin: 'ann',
  commentsCount,
});

describe('toPostSummaries', () => {
  it('keeps only the posts of the blog, in the order of the stubs', () => {
    const summaries = toPostSummaries([stub('a', 'b1'), stub('b', 'b2'), stub('c', 'b1', 3)], 'b1');
    expect(summaries).toEqual([
      {id: 'a', summary: 'Post a', commentsCount: 0},
      {id: 'c', summary: 'Post c', commentsCount: 3},
    ]);
  });

  it('is empty for a blog without posts', () => {
    expect(toPostSummaries([stub('a', 'b1')], 'b9')).toEqual([]);
  });
});
