import {useCallback, useEffect, useRef, useState} from 'react';

import type {BlogConfig, PostReaction} from '../types';
import {useHost} from '../../api/host-context';
import {AppPostReactionsRepository, subscribeReactions} from './app-post-reactions-repository';
import {hasReactionsFor} from './has-reactions-for';
import {mergeReactions} from './merge-reactions';
import type {ReactionsByPost} from './post-reactions-repository';
import {togglePostReaction as toggleReactionOnPost} from './toggle-post-reaction';

interface LoadReactionsOptions {
  complete?: boolean;
  markReady?: boolean;
}

interface UseReactionsResult {
  reactionsByPost: ReactionsByPost;
  reactionsLoadingFor: (postIds: readonly string[]) => boolean;
  loadReactions: (postIds: readonly string[], options?: LoadReactionsOptions) => Promise<void>;
  togglePostReaction: (postId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
}

export function useReactions(config: BlogConfig, resetKey: string): UseReactionsResult {
  const host = useHost();
  const [reactionsByPost, setReactionsByPost] = useState<ReactionsByPost>(
    () => new AppPostReactionsRepository(host, config).getCachedReactions() ?? {},
  );
  const [reactionsReady, setReactionsReady] = useState(() => new AppPostReactionsRepository(host, config).hasLoadedReactions());
  const touchedRef = useRef<Set<string>>(new Set());
  const generationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    generationRef.current += 1;
    const repo = new AppPostReactionsRepository(host, config);
    const unsubscribe = subscribeReactions((projectShortName, loaded) => {
      if (!cancelled && projectShortName === config.projectShortName) {
        setReactionsByPost(prev => ({...prev, ...loaded}));
      }
    });
    setReactionsByPost(repo.getCachedReactions() ?? {});
    setReactionsReady(repo.hasLoadedReactions());
    return () => {
      cancelled = true;
      generationRef.current += 1;
      unsubscribe();
    };
  }, [host, config, resetKey]);

  const loadReactions = useCallback(async (postIds: readonly string[], {complete = false, markReady = false}: LoadReactionsOptions = {}) => {
    const generation = generationRef.current;
    const loaded = await new AppPostReactionsRepository(host, config).getReactions(postIds, complete).catch(() => null);
    if (generation !== generationRef.current) {return;}
    if (loaded) {
      if (markReady) {setReactionsReady(true);}
      setReactionsByPost(prev => mergeReactions(prev, loaded, touchedRef.current));
    }
  }, [host, config]);

  const applyReactions = (postId: string, reactions: readonly PostReaction[]) => {
    touchedRef.current.add(postId);
    setReactionsByPost(prev => ({...prev, [postId]: reactions}));
  };

  const togglePostReaction = async (postId: string, reaction: string, ownReactionId: string | null) => {
    await toggleReactionOnPost(new AppPostReactionsRepository(host, config), postId, reaction, !ownReactionId, reactionsByPost[postId] ?? [], applyReactions);
  };

  const reactionsLoadingFor = (postIds: readonly string[]) => !reactionsReady && !hasReactionsFor(reactionsByPost, postIds);

  return {reactionsByPost, reactionsLoadingFor, loadReactions, togglePostReaction};
}
