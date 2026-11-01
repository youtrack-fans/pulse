import {POST_CACHE_TTL_MS} from '../../config/constants';
import {isFresh} from '../../lib/freshness';
import type {BlogPost} from '../types';

interface CachedPost {
  post: BlogPost;
  storedAt: number;
}

const postsById = new Map<string, CachedPost>();

export function rememberPosts(posts: readonly BlogPost[]): void {
  const storedAt = Date.now();
  posts.forEach(post => postsById.set(post.id, {post, storedAt}));
}

export function peekPost(postId: string): BlogPost | null {
  const cached = postsById.get(postId);
  if (!cached) {
    return null;
  }
  if (!isFresh(cached.storedAt, Date.now(), POST_CACHE_TTL_MS)) {
    postsById.delete(postId);
    return null;
  }
  return cached.post;
}

export function patchCachedPost(postId: string, patch: (post: BlogPost) => BlogPost): void {
  const cached = postsById.get(postId);
  if (cached) {
    postsById.set(postId, {post: patch(cached.post), storedAt: cached.storedAt});
  }
}

export function clearPostCache(): void {
  postsById.clear();
}
