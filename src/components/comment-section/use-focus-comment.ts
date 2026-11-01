import {useEffect, useRef, useState} from 'react';

import type {ArticleComment} from '../../data/types';
import {shouldApplyTarget} from './comment-target';

const ALIGN_NOW_MS = 0;
const ALIGN_SOON_MS = 250;
const ALIGN_LATER_MS = 700;
const ALIGN_LAST_MS = 1500;
const ALIGN_DELAYS_MS = [ALIGN_NOW_MS, ALIGN_SOON_MS, ALIGN_LATER_MS, ALIGN_LAST_MS];

interface FocusThread {
  root: ArticleComment;
  replies: readonly ArticleComment[];
}

interface UseFocusCommentParams {
  focusCommentId?: string;
  comments: readonly ArticleComment[];
  threads: readonly FocusThread[];
  onReveal: (rootId: string) => void;
}

export const useFocusComment = ({focusCommentId, comments, threads, onReveal}: UseFocusCommentParams) => {
  const appliedTarget = useRef<string | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusCommentId || !shouldApplyTarget(focusCommentId, appliedTarget.current, comments.some(comment => comment.id === focusCommentId))) {
      return;
    }
    appliedTarget.current = focusCommentId;
    const thread = threads.find(t => t.root.id === focusCommentId
      || t.replies.some(reply => reply.id === focusCommentId));
    if (thread) {
      onReveal(thread.root.id);
    }
    setFocusedCommentId(focusCommentId);
  }, [focusCommentId, comments, threads, onReveal]);

  useEffect(() => {
    if (!focusedCommentId) {
      return undefined;
    }
    const align = () => {
      document
        .querySelector(`[data-comment-id="${focusedCommentId}"]`)
        ?.scrollIntoView({block: 'center'});
    };
    const timers = ALIGN_DELAYS_MS.map(delay => window.setTimeout(align, delay));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [focusedCommentId]);

  return focusedCommentId;
};
