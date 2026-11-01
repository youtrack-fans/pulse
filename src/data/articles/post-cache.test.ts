import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {POST_CACHE_TTL_MS} from '../../config/constants';
import type {BlogPost} from '../types';
import {clearPostCache, patchCachedPost, peekPost, rememberPosts} from './post-cache';

const post = (id: string, extra: Partial<BlogPost> = {}): BlogPost => ({id, summary: id, commentsCount: 0, hasStar: false, ...extra} as BlogPost);

describe('post cache', () => {
  beforeEach(clearPostCache);

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for a post that was never loaded', () => {
    expect(peekPost('a')).toBeNull();
  });

  it('returns a remembered post', () => {
    const first = post('a');
    rememberPosts([first, post('b')]);
    expect(peekPost('a')).toBe(first);
  });

  it('replaces a post that is remembered again', () => {
    rememberPosts([post('a', {commentsCount: 1})]);
    rememberPosts([post('a', {commentsCount: 4})]);
    expect(peekPost('a')?.commentsCount).toBe(4);
  });

  it('patches only the requested post', () => {
    rememberPosts([post('a'), post('b')]);
    patchCachedPost('a', value => ({...value, hasStar: true}));
    expect([peekPost('a')?.hasStar, peekPost('b')?.hasStar]).toEqual([true, false]);
  });

  it('ignores a patch for a post that is not cached', () => {
    patchCachedPost('missing', value => ({...value, hasStar: true}));
    expect(peekPost('missing')).toBeNull();
  });

  it('keeps a post until its lifetime ends', () => {
    vi.useFakeTimers();
    rememberPosts([post('a')]);
    vi.advanceTimersByTime(POST_CACHE_TTL_MS - 1);
    expect(peekPost('a')).not.toBeNull();
  });

  it('drops a post once its lifetime has ended', () => {
    vi.useFakeTimers();
    rememberPosts([post('a')]);
    vi.advanceTimersByTime(POST_CACHE_TTL_MS + 1);
    expect(peekPost('a')).toBeNull();
  });

  it('does not extend the lifetime of a post when it is patched', () => {
    vi.useFakeTimers();
    rememberPosts([post('a')]);
    vi.advanceTimersByTime(POST_CACHE_TTL_MS - 1000);
    patchCachedPost('a', value => ({...value, hasStar: true}));
    vi.advanceTimersByTime(2000);
    expect(peekPost('a')).toBeNull();
  });
});
