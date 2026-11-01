import {useEffect, useState} from 'react';

import type {BlogConfig, BlogPost, ArticleComment, PostReaction} from '../../data/types';
import {useHost} from '../../api/host-context';
import {YtArticlesRepository} from '../../data/articles/yt-articles-repository';
import {toggleStarOptimistic} from '../../data/articles/toggle-star';
import {patchCachedPost, peekPost} from '../../data/articles/post-cache';
import {AppPostReactionsRepository} from '../../data/post-reactions/app-post-reactions-repository';
import {togglePostReaction as toggleReactionOnPost} from '../../data/post-reactions/toggle-post-reaction';
import {guarded} from '../../lib/guarded';

interface UsePostResult {
  post: BlogPost | null;
  comments: readonly ArticleComment[];
  replyMap: Readonly<Record<string, string>>;
  postReactions: readonly PostReaction[];
  loading: boolean;
  commentsLoading: boolean;
  error: string | null;
  commentsError: string | null;
  retry: () => void;
  addComment: (text: string) => Promise<boolean>;
  addReply: (parentCommentId: string, text: string) => Promise<boolean>;
  toggleReaction: (commentId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
  togglePostReaction: (reaction: string, ownReactionId: string | null) => Promise<void>;
  toggleStar: () => void;
}

export function usePost(postId: string, config: BlogConfig): UsePostResult {
  const host = useHost();
  const [post, setPost] = useState<BlogPost | null>(() => peekPost(postId));
  const [comments, setComments] = useState<readonly ArticleComment[]>([]);
  const [postReactions, setPostReactions] = useState<readonly PostReaction[]>([]);
  const [loading, setLoading] = useState(() => peekPost(postId) === null);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const articlesRepo = new YtArticlesRepository(host);
    const reactionsRepo = new AppPostReactionsRepository(host, config);
    const cachedPost = peekPost(postId);
    setPost(cachedPost);
    setLoading(cachedPost === null);
    setCommentsLoading(true);
    setError(null);
    setCommentsError(null);
    const cachedReactions = reactionsRepo.getCachedReactions();
    setPostReactions(cachedReactions?.[postId] ?? []);

    const loadPost = async () => {
      try {
        const {post: loadedPost, comments: loadedComments} = await articlesRepo.getPostWithComments(postId);
        if (cancelled) {return;}
        setPost(loadedPost);
        setComments(loadedComments);
        setLoading(false);
        setCommentsLoading(false);
      } catch {
        if (cancelled) {return;}
        if (cachedPost) {
          setCommentsError('The comments could not be loaded.');
        } else {
          setError('This post could not be loaded.');
        }
        setLoading(false);
        setCommentsLoading(false);
      }
    };

    const loadReactions = async () => {
      const loaded = await reactionsRepo.getReactions([postId]).catch(() => null);
      if (!cancelled && loaded) {setPostReactions(loaded[postId] ?? []);}
    };

    loadPost();
    loadReactions();

    return () => {
      cancelled = true;
    };
  }, [host, config, postId, attempt]);

  const replyMap: Record<string, string> = {};
  comments.forEach(comment => {
    if (comment.parentCommentId) {
      replyMap[comment.id] = comment.parentCommentId;
    }
  });

  const submitComment = async (text: string, parentCommentId?: string) => {
    const action = parentCommentId ? 'post the reply' : 'post the comment';
    const newComment = await guarded(action, () => new YtArticlesRepository(host).addComment(postId, text, parentCommentId));
    if (!newComment) {return false;}
    setComments(prev => [...prev, newComment]);
    return true;
  };

  const addComment = (text: string) => submitComment(text);

  const addReply = (parentCommentId: string, text: string) => submitComment(text, parentCommentId);

  const toggleReaction = async (commentId: string, reaction: string, ownReactionId: string | null) => {
    const articlesRepo = new YtArticlesRepository(host);
    if (ownReactionId) {
      const removed = await guarded('remove the like', () => articlesRepo.removeReaction(postId, commentId, ownReactionId).then(() => true));
      if (!removed) {return;}
      setComments(prev => prev.map(comment => comment.id === commentId
        ? {...comment, reactions: comment.reactions.filter(r => r.id !== ownReactionId)}
        : comment));
    } else {
      const created = await guarded('add the like', () => articlesRepo.addReaction(postId, commentId, reaction));
      if (!created) {return;}
      setComments(prev => prev.map(comment => comment.id === commentId
        ? {...comment, reactions: [...comment.reactions.filter(r => r.id !== created.id), created]}
        : comment));
    }
  };

  const applyReactions = (reactedPostId: string, reactions: readonly PostReaction[]) => {
    setPostReactions(reactions);
  };

  const togglePostReaction = async (reaction: string, ownReactionId: string | null) => {
    await toggleReactionOnPost(new AppPostReactionsRepository(host, config), postId, reaction, !ownReactionId, postReactions, applyReactions);
  };

  const toggleStar = async () => {
    if (!post) {return;}
    const nextHasStar = !post.hasStar;
    await toggleStarOptimistic(new YtArticlesRepository(host), postId, nextHasStar, value => {
      patchCachedPost(postId, cached => ({...cached, hasStar: value}));
      setPost(prev => (prev ? {...prev, hasStar: value} : prev));
    });
  };

  return {
    post,
    comments,
    replyMap,
    postReactions,
    loading,
    commentsLoading,
    error,
    commentsError,
    retry: () => setAttempt(count => count + 1),
    addComment,
    addReply,
    toggleReaction,
    togglePostReaction,
    toggleStar,
  };
}
