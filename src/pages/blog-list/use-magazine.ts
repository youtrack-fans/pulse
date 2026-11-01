import {useCallback, useEffect, useRef, useState} from 'react';

import type {Blog, BlogConfig, MagazinePostStub} from '../../data/types';
import {useHost} from '../../api/host-context';
import {YtArticlesRepository} from '../../data/articles/yt-articles-repository';
import {peekProjectIndex} from '../../data/articles/project-index';
import {toggleStarOptimistic} from '../../data/articles/toggle-star';
import {patchCachedPost} from '../../data/articles/post-cache';
import type {ReactionsByPost} from '../../data/post-reactions/post-reactions-repository';
import {useReactions} from '../../data/post-reactions/use-reactions';
import {createRequestGeneration} from '../../lib/request-generation';
import {FIRST_LOAD_POSTS} from '../../config/constants';
import {mergePosts, patchPost, type PostsById} from './post-patches';

interface UseMagazineResult {
  blogs: readonly Blog[];
  stubs: readonly MagazinePostStub[];
  postsById: PostsById;
  reactionsByPost: ReactionsByPost;
  reactionsLoading: boolean;
  loading: boolean;
  indexLoading: boolean;
  error: string | null;
  postsFailed: boolean;
  retry: () => void;
  ensureLoaded: (stubs: readonly MagazinePostStub[]) => void;
  toggleStar: (postId: string, hasStar: boolean) => void;
  togglePostReaction: (postId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
}

const postsCacheByProject = new Map<string, PostsById>();

export function useMagazine(config: BlogConfig): UseMagazineResult {
  const host = useHost();
  const cachedIndex = peekProjectIndex(config.projectShortName);
  const [blogs, setBlogs] = useState<readonly Blog[]>(() => cachedIndex?.blogs ?? []);
  const [stubs, setStubs] = useState<readonly MagazinePostStub[]>(() => cachedIndex?.stubs ?? []);
  const [postsById, setPostsById] = useState<PostsById>(() => postsCacheByProject.get(config.projectShortName) ?? {});
  const postsRef = useRef(postsById);
  const [loading, setLoading] = useState(() => !cachedIndex);
  const [indexLoading, setIndexLoading] = useState(() => !cachedIndex);
  const [error, setError] = useState<string | null>(null);
  const [postsFailed, setPostsFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const {reactionsByPost, reactionsLoadingFor, loadReactions, togglePostReaction} = useReactions(config, String(attempt));
  const requestedRef = useRef<Set<string>>(new Set());
  const [generation] = useState(createRequestGeneration);

  const updatePosts = useCallback((update: (previous: PostsById) => PostsById) => {
    const next = update(postsRef.current);
    postsRef.current = next;
    postsCacheByProject.set(config.projectShortName, next);
    setPostsById(next);
  }, [config.projectShortName]);

  useEffect(() => {
    const token = generation.next();
    const cancelled = () => !generation.isCurrent(token);
    const articlesRepo = new YtArticlesRepository(host);
    const hasCache = peekProjectIndex(config.projectShortName) !== null;
    setLoading(!hasCache);
    setIndexLoading(!hasCache);
    setError(null);
    setPostsFailed(false);
    requestedRef.current = new Set();

    let indexReady = false;

    const loadMagazine = async () => {
      try {
        const [loadedBlogs, loadedStubs] = await Promise.all([
          articlesRepo.getBlogs(config.projectShortName),
          articlesRepo.getPostStubs(config.projectShortName),
        ]);
        if (cancelled()) {return;}
        indexReady = true;
        setBlogs(loadedBlogs);
        setStubs(loadedStubs);
        setIndexLoading(false);
        setLoading(false);
        loadReactions(loadedStubs.map(stub => stub.id), {complete: true, markReady: true});
      } catch {
        if (cancelled()) {return;}
        setError('Blogs could not be loaded.');
        setLoading(false);
      }
    };

    const loadFirstPage = async () => {
      const latest = await articlesRepo.getLatestPosts(config.projectShortName, FIRST_LOAD_POSTS).catch(() => null);
      if (!latest || cancelled() || indexReady || latest.posts.length === 0) {return;}
      const {posts, stubs: firstStubs} = latest;
      posts.forEach(post => requestedRef.current.add(post.id));
      updatePosts(previous => mergePosts(previous, posts));
      setStubs(firstStubs);
      setLoading(false);
      loadReactions(posts.map(post => post.id));
    };

    if (!hasCache) {
      loadFirstPage();
    }
    loadMagazine();

    return () => {
      generation.next();
    };
  }, [host, config, attempt, loadReactions, generation, updatePosts]);

  const ensureLoaded = (requested: readonly MagazinePostStub[]) => {
    const missing = requested.filter(stub => !requestedRef.current.has(stub.id));
    if (missing.length === 0) {return;}
    missing.forEach(stub => requestedRef.current.add(stub.id));
    const token = generation.current();
    const load = async () => {
      try {
        const loaded = await new YtArticlesRepository(host).getPostsByReadableIds(missing.map(stub => stub.idReadable));
        if (!generation.isCurrent(token)) {return;}
        updatePosts(previous => mergePosts(previous, loaded));
      } catch {
        if (generation.isCurrent(token)) {
          setPostsFailed(true);
        }
      }
    };
    load();
  };

  const toggleStar = async (postId: string, hasStar: boolean) => {
    await toggleStarOptimistic(new YtArticlesRepository(host), postId, hasStar, value => {
      patchCachedPost(postId, cached => ({...cached, hasStar: value}));
      updatePosts(previous => patchPost(previous, postId, post => ({...post, hasStar: value})));
    });
  };

  const retry = () => setAttempt(count => count + 1);

  return {blogs, stubs, postsById, reactionsByPost, reactionsLoading: reactionsLoadingFor(stubs.map(stub => stub.id)), loading, indexLoading, error, postsFailed, retry, ensureLoaded, toggleStar, togglePostReaction};
}
