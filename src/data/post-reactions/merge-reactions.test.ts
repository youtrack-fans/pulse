import {describe, expect, it} from 'vitest';

import type {PostReaction} from '../types';
import {mergeReactions} from './merge-reactions';

const like = (authorLogin: string): PostReaction => ({id: `${authorLogin}:❤️`, reaction: '❤️', authorLogin});

describe('mergeReactions', () => {
  it('adds loaded posts to the previous ones', () => {
    const merged = mergeReactions({a: [like('ann')]}, {b: [like('bob')]}, new Set());
    expect(merged).toEqual({a: [like('ann')], b: [like('bob')]});
  });

  it('lets loaded reactions replace untouched posts', () => {
    const merged = mergeReactions({a: [like('ann')]}, {a: [like('bob')]}, new Set());
    expect(merged.a).toEqual([like('bob')]);
  });

  it('keeps the previous reactions of a post the user already changed', () => {
    const merged = mergeReactions({a: [like('ann')]}, {a: []}, new Set(['a']));
    expect(merged.a).toEqual([like('ann')]);
  });

  it('starts a touched post without previous reactions from an empty list', () => {
    const merged = mergeReactions({}, {a: [like('bob')]}, new Set(['a']));
    expect(merged.a).toEqual([]);
  });

  it('does not mutate the previous reactions', () => {
    const previous = {a: [like('ann')]};
    mergeReactions(previous, {a: []}, new Set());
    expect(previous.a).toEqual([like('ann')]);
  });
});
