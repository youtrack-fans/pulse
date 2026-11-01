import {useEffect, useState} from 'react';

import type {BlogConfig, BookmarkedPost} from '../types';
import {useHost} from '../../api/host-context';
import {fetchBookmarkedPosts} from './yt-bookmarks-repository';

interface BookmarkedPostsState {
  posts: readonly BookmarkedPost[] | null;
  error: string | null;
  retry: () => void;
}

const cache = new Map<string, readonly BookmarkedPost[]>();

export function useBookmarkedPosts(config: BlogConfig, enabled: boolean): BookmarkedPostsState {
  const host = useHost();
  const [posts, setPosts] = useState<readonly BookmarkedPost[] | null>(() => cache.get(config.projectShortName) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let cancelled = false;
    setError(null);
    fetchBookmarkedPosts(host, config)
      .then(result => {
        if (!cancelled) {
          cache.set(config.projectShortName, result);
          setPosts(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Bookmarks could not be loaded.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [host, config, attempt, enabled]);

  return {posts, error, retry: () => setAttempt(count => count + 1)};
}
