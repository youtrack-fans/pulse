import {describe, expect, it} from 'vitest';

import type {BlogPost} from '../../data/types';
import {mergePosts, patchPost} from './post-patches';

const post = (id: string, extra: Partial<BlogPost> = {}): BlogPost => ({id, summary: id, commentsCount: 0, hasStar: false, ...extra} as BlogPost);

describe('mergePosts', () => {
  it('adds new posts and keeps the existing ones', () => {
    const merged = mergePosts({a: post('a')}, [post('b')]);
    expect(Object.keys(merged)).toEqual(['a', 'b']);
  });

  it('replaces a post that is loaded again', () => {
    const merged = mergePosts({a: post('a', {commentsCount: 1})}, [post('a', {commentsCount: 5})]);
    expect(merged.a.commentsCount).toBe(5);
  });

  it('does not mutate the previous posts', () => {
    const previous = {a: post('a')};
    mergePosts(previous, [post('b')]);
    expect(Object.keys(previous)).toEqual(['a']);
  });
});

describe('patchPost', () => {
  it('changes only the requested post', () => {
    const patched = patchPost({a: post('a'), b: post('b')}, 'a', value => ({...value, hasStar: true}));
    expect([patched.a.hasStar, patched.b.hasStar]).toEqual([true, false]);
  });

  it('returns the same object when the post is not loaded', () => {
    const previous = {a: post('a')};
    expect(patchPost(previous, 'missing', value => ({...value, hasStar: true}))).toBe(previous);
  });
});
