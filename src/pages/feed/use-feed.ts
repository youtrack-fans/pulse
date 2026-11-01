import {useEffect, useRef, useState} from 'react';

import type {BlogConfig, BlogPost, PostSummary} from '../../data/types';
import {useHost} from '../../api/host-context';
import {YtArticlesRepository} from '../../data/articles/yt-articles-repository';
import {toggleStarOptimistic} from '../../data/articles/toggle-star';
import {patchCachedPost} from '../../data/articles/post-cache';
import type {ReactionsByPost} from '../../data/post-reactions/post-reactions-repository';
import {useReactions} from '../../data/post-reactions/use-reactions';
import {guarded} from '../../lib/guarded';
import {createRequestGeneration} from '../../lib/request-generation';
import {mergeFirstPage, readFeedSeed} from './feed-seed';
import {FIRST_LOAD_POSTS, POSTS_PER_PAGE} from '../../config/constants';

interface UseFeedResult {
  posts: readonly BlogPost[];
  trendingPosts: readonly PostSummary[];
  reactionsByPost: ReactionsByPost;
  reactionsLoading: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  loadMoreFailed: boolean;
  retry: () => void;
  toggleStar: (postId: string, hasStar: boolean) => void;
  togglePostReaction: (postId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
}

export function useFeed(blogId: string, config: BlogConfig): UseFeedResult {
  const host = useHost();
  const [initialSeed] = useState(() => readFeedSeed(config.projectShortName, blogId, FIRST_LOAD_POSTS));
  const [posts, setPosts] = useState<readonly BlogPost[]>(() => initialSeed?.posts ?? []);
  const [trendingPosts, setTrendingPosts] = useState<readonly PostSummary[]>(() => initialSeed?.summary ?? []);
  const [total, setTotal] = useState(() => initialSeed?.summary.length ?? 0);
  const [loading, setLoading] = useState(() => !initialSeed?.posts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const {reactionsByPost, reactionsLoadingFor, loadReactions, togglePostReaction} = useReactions(config, `${blogId}:${attempt}`);

  const [generation] = useState(createRequestGeneration);
  const loadingRef = useRef(false);

  useEffect(() => {
    const token = generation.next();
    const cancelled = () => !generation.isCurrent(token);
    loadingRef.current = false;
    setLoadingMore(false);
    const articlesRepo = new YtArticlesRepository(host);
    const seed = readFeedSeed(config.projectShortName, blogId, FIRST_LOAD_POSTS);
    const showingSeed = Boolean(seed?.posts);
    setError(null);
    setLoadMoreFailed(false);
    setLoading(!showingSeed);
    if (!showingSeed) {
      setPosts([]);
      setTrendingPosts(seed?.summary ?? []);
      setTotal(seed?.summary.length ?? 0);
    }
    const loadFeed = async () => {
      try {
        const summary = await articlesRepo.getPostsSummary(config.projectShortName, blogId);
        const count = summary.length;
        if (cancelled()) {return;}
        setTotal(count);
        setTrendingPosts(summary);
        const firstPage = await articlesRepo.getPostsPage(blogId, 0, FIRST_LOAD_POSTS, count);
        if (cancelled()) {return;}
        const knownIds = new Set(summary.map(post => post.id));
        setPosts(previous => mergeFirstPage(previous, firstPage, knownIds));
        setLoading(false);
        loadReactions(summary.map(post => post.id), {markReady: true});
      } catch {
        if (cancelled()) {return;}
        if (!showingSeed) {
          setError('This blog could not be loaded.');
        }
        setLoading(false);
      }
    };

    loadFeed();

    return () => {
      generation.next();
    };
  }, [host, config, blogId, attempt, loadReactions, generation]);

  const loadMore = async () => {
    if (loadingRef.current) {return;}
    const offset = posts.length;
    if (offset >= total) {return;}

    const token = generation.current();
    loadingRef.current = true;
    setLoadMoreFailed(false);
    setLoadingMore(true);
    try {
      const page = await guarded('load more posts', () => new YtArticlesRepository(host).getPostsPage(blogId, offset, POSTS_PER_PAGE, total));
      if (!generation.isCurrent(token)) {return;}
      if (!page) {
        setLoadMoreFailed(true);
      } else {
        setPosts(prev => [...prev, ...page]);
      }
    } finally {
      if (generation.isCurrent(token)) {
        loadingRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  const toggleStar = async (postId: string, hasStar: boolean) => {
    await toggleStarOptimistic(new YtArticlesRepository(host), postId, hasStar, value => {
      patchCachedPost(postId, cached => ({...cached, hasStar: value}));
      setPosts(prev => prev.map(post => post.id === postId ? {...post, hasStar: value} : post));
    });
  };

  return {
    posts,
    trendingPosts,
    reactionsByPost,
    reactionsLoading: reactionsLoadingFor(trendingPosts.map(post => post.id)),
    loading,
    loadingMore,
    hasMore: posts.length < total,
    error,
    loadMore,
    loadMoreFailed,
    retry: () => setAttempt(count => count + 1),
    toggleStar,
    togglePostReaction,
  };
}
