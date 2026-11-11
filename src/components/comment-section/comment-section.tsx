import React, {useState, useEffect, useRef, useMemo} from 'react';

import type {ArticleComment, CommentReaction, Author} from '../../data/types';
import {formatShortDate} from '../../lib/date';
import {Avatar} from '../avatar/avatar';
import {HeartGlyph} from '../../icons/icons';
import {renderCommentContent} from '../post-content/render-post-content';
import {LIKE_REACTION} from '../../config/constants';
import {useFocusComment} from './use-focus-comment';
import {shouldApplyTarget} from './comment-target';

import styles from './comment-section.module.css';

interface CommentSectionProps {
  comments: readonly ArticleComment[];
  replyMap: Readonly<Record<string, string>>;
  initialReplyTo?: string;
  focusCommentId?: string;
  loading: boolean;
  postAuthorLogin: string;
  contextPath: string;
  currentUser?: Author | null;
  onAddComment: (text: string) => Promise<boolean>;
  onAddReply: (parentCommentId: string, text: string) => Promise<boolean>;
  onToggleReaction: (commentId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
}

interface CommentThread {
  root: ArticleComment;
  replies: readonly ArticleComment[];
}

interface CommentTextProps {
  text: string;
  contextPath: string;
}

const CommentText: React.FunctionComponent<CommentTextProps> = ({text, contextPath}) => {
  const html = useMemo(() => renderCommentContent(text, contextPath), [text, contextPath]);
  return <div className={styles.text} dangerouslySetInnerHTML={{__html: html}}/>;
};

const SEND_SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ Enter' : 'Ctrl+Enter';

const VISIBLE_BY_DEFAULT = 4;
const VISIBLE_REPLIES_BY_DEFAULT = 3;

type CommentSort = 'top' | 'newest' | 'oldest';

interface SortOption {
  key: CommentSort;
  label: string;
}

const SORT_OPTIONS: readonly SortOption[] = [
  {key: 'top', label: 'Top first'},
  {key: 'newest', label: 'Newest first'},
  {key: 'oldest', label: 'Oldest first'},
];

function getThreadEngagement(thread: CommentThread): number {
  return thread.root.reactions.length
    + thread.replies.reduce((sum, reply) => sum + reply.reactions.length, 0)
    + thread.replies.length;
}

function sortThreads(threads: readonly CommentThread[], sort: CommentSort): readonly CommentThread[] {
  const sorted = [...threads];
  if (sort === 'top') {
    sorted.sort((a, b) =>
      getThreadEngagement(b) - getThreadEngagement(a) || a.root.created - b.root.created);
  } else if (sort === 'newest') {
    sorted.sort((a, b) => b.root.created - a.root.created);
  } else {
    sorted.sort((a, b) => a.root.created - b.root.created);
  }
  return sorted;
}

interface ReactionGroup {
  reaction: string;
  count: number;
  ownReactionId: string | null;
  authors: readonly string[];
}

function groupReactions(
  reactions: readonly CommentReaction[],
  currentUserLogin: string | undefined,
): readonly ReactionGroup[] {
  const groups = new Map<string, {count: number; ownReactionId: string | null; authors: string[]}>();
  reactions.forEach(reaction => {
    const group = groups.get(reaction.reaction) ?? {count: 0, ownReactionId: null, authors: []};
    group.count += 1;
    group.authors.push(reaction.authorFullName);
    if (currentUserLogin && reaction.authorLogin === currentUserLogin) {
      group.ownReactionId = reaction.id;
    }
    groups.set(reaction.reaction, group);
  });
  return Array.from(groups.entries()).map(([reaction, group]) => ({reaction, ...group}));
}

function buildThreads(
  comments: readonly ArticleComment[],
  replyMap: Readonly<Record<string, string>>,
): readonly CommentThread[] {
  const commentIds = new Set(comments.map(comment => comment.id));
  const resolveRoot = (comment: ArticleComment): string => {
    let currentId = comment.id;
    const seen = new Set<string>();
    while (replyMap[currentId] && commentIds.has(replyMap[currentId]) && !seen.has(currentId)) {
      seen.add(currentId);
      currentId = replyMap[currentId];
    }
    return currentId;
  };

  const repliesByRoot = new Map<string, ArticleComment[]>();
  const roots: ArticleComment[] = [];
  comments.forEach(comment => {
    const rootId = resolveRoot(comment);
    if (rootId === comment.id) {
      roots.push(comment);
    } else {
      const bucket = repliesByRoot.get(rootId);
      if (bucket) {
        bucket.push(comment);
      } else {
        repliesByRoot.set(rootId, [comment]);
      }
    }
  });

  return roots.map(root => ({root, replies: repliesByRoot.get(root.id) ?? []}));
}

const ROOT_AVATAR_SIZE = 36;
const REPLY_AVATAR_SIZE = 30;

interface LikeButtonProps {
  commentId: string;
  group: ReactionGroup | undefined;
  onToggleReaction: CommentSectionProps['onToggleReaction'];
}

const LikeButton: React.FunctionComponent<LikeButtonProps> = ({commentId, group, onToggleReaction}) => {
  const handleClick = () => onToggleReaction(commentId, LIKE_REACTION, group?.ownReactionId ?? null);
  return (
    <button
      type="button"
      className={group?.ownReactionId ? `${styles.like} ${styles.likeOn}` : styles.like}
      title={group ? group.authors.join(', ') : 'Like'}
      aria-label="Like"
      aria-pressed={Boolean(group?.ownReactionId)}
      onClick={handleClick}
    >
      <HeartGlyph size={15} on={Boolean(group?.ownReactionId)}/>
      {group && <span className={styles.count}>{group.count}</span>}
    </button>
  );
};

interface ReplyButtonProps {
  threadRootId: string;
  onReply: (rootId: string) => void;
}

const ReplyButton: React.FunctionComponent<ReplyButtonProps> = ({threadRootId, onReply}) => {
  const handleClick = () => onReply(threadRootId);
  return (
    <button type="button" className={styles.replyBtn} onClick={handleClick}>
      Reply
    </button>
  );
};

interface ShowMoreRepliesProps {
  threadId: string;
  hiddenCount: number;
  onExpand: (threadId: string) => void;
}

const ShowMoreReplies: React.FunctionComponent<ShowMoreRepliesProps> = ({threadId, hiddenCount, onExpand}) => {
  const handleClick = () => onExpand(threadId);
  return (
    <button type="button" className={styles.moreReplies} onClick={handleClick}>
      Show {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
    </button>
  );
};

export const CommentSection: React.FunctionComponent<CommentSectionProps> = ({
  comments,
  replyMap,
  initialReplyTo,
  focusCommentId,
  loading,
  postAuthorLogin,
  contextPath,
  currentUser,
  onAddComment,
  onAddReply,
  onToggleReaction,
}) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<ReadonlySet<string>>(() => new Set());

  const [sort, setSort] = useState<CommentSort>('top');
  const appliedReplyTarget = useRef<string | null>(null);
  const replyComposerRef = useRef<HTMLDivElement | null>(null);
  const threads = sortThreads(buildThreads(comments, replyMap), sort);
  const focusedCommentId = useFocusComment({
    focusCommentId,
    comments,
    threads,
    onReveal: rootId => {
      setExpanded(true);
      setExpandedThreads(prev => (prev.has(rootId) ? prev : new Set(prev).add(rootId)));
    },
  });

  useEffect(() => {
    if (!initialReplyTo) {
      return;
    }
    const thread = threads.find(t => t.root.id === initialReplyTo
      || t.replies.some(reply => reply.id === initialReplyTo));
    if (!shouldApplyTarget(initialReplyTo, appliedReplyTarget.current, Boolean(thread)) || !thread) {
      return;
    }
    appliedReplyTarget.current = initialReplyTo;
    setExpanded(true);
    setReplyingTo(thread.root.id);
  }, [initialReplyTo, comments, threads]);

  useEffect(() => {
    if (replyingTo) {
      replyComposerRef.current?.scrollIntoView({block: 'center', behavior: 'smooth'});
    }
  }, [replyingTo]);

  const handleSubmit = async () => {
    const text = commentText.trim();
    if (!text) {return;}

    setSubmitting(true);
    try {
      if (await onAddComment(text)) {
        setCommentText('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const expandThread = (rootId: string) => setExpandedThreads(prev => new Set(prev).add(rootId));

  const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(event.target.value);
  const handleReplyChange = (event: React.ChangeEvent<HTMLInputElement>) => setReplyText(event.target.value);
  const showAllThreads = () => setExpanded(true);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const option = SORT_OPTIONS.find(candidate => candidate.key === event.target.value);
    if (option) {
      setSort(option.key);
    }
  };

  const openReply = (rootId: string) => {
    setReplyingTo(prev => (prev === rootId ? null : rootId));
    setReplyText('');
  };

  const handleReplySubmit = async () => {
    const text = replyText.trim();
    if (!text || !replyingTo) {return;}

    setReplySubmitting(true);
    try {
      if (await onAddReply(replyingTo, text)) {
        setReplyText('');
        setReplyingTo(null);
      }
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleReplySubmit();
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
    }
  };

  const renderComment = (comment: ArticleComment, threadRootId: string): React.ReactNode => {
    const groups = groupReactions(comment.reactions, currentUser?.login);
    const likeGroup = groups.find(group => group.reaction === LIKE_REACTION);

    return (
      <div
        data-comment-id={comment.id}
        className={[
          comment.id === threadRootId ? styles.comment : styles.reply,
          comment.id === focusedCommentId ? styles.focused : '',
        ].join(' ').trim()}
      >
        <Avatar
          name={comment.author.fullName}
          avatarUrl={comment.author.avatarUrl}
          size={comment.id === threadRootId ? ROOT_AVATAR_SIZE : REPLY_AVATAR_SIZE}
        />
        <div className={styles.body}>
          <div>
            <span className={styles.name}>{comment.author.fullName}</span>
            {comment.author.login === postAuthorLogin && (
              <span className={styles.authorBadge}>AUTHOR</span>
            )}
            <span className={styles.time}>· {formatShortDate(comment.created)}</span>
          </div>
          <CommentText text={comment.text} contextPath={contextPath}/>
          <div className={styles.meta}>
            <LikeButton commentId={comment.id} group={likeGroup} onToggleReaction={onToggleReaction}/>
            <ReplyButton threadRootId={threadRootId} onReply={openReply}/>
          </div>
        </div>
      </div>
    );
  };

  const visibleThreads = expanded ? threads : threads.slice(0, VISIBLE_BY_DEFAULT);
  const hiddenCount = threads.length - visibleThreads.length;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.heading}>
          {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}` : 'Comments'}
        </h2>
        <span className={styles.sort}>
          <select
            className={styles.sortSelect}
            aria-label="Sort comments"
            value={sort}
            onChange={handleSortChange}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </span>
      </div>

      <div className={styles.composer}>
        {currentUser && (
          <Avatar name={currentUser.fullName} avatarUrl={currentUser.avatarUrl} size={36}/>
        )}
        <textarea
          className={styles.textarea}
          aria-label="Add a comment"
          value={commentText}
          onChange={handleCommentChange}
          onKeyDown={handleKeyDown}
          placeholder={`Add a comment · ${SEND_SHORTCUT} to send`}
          rows={1}
          disabled={submitting}
        />
      </div>

      {!loading && comments.length === 0 && (
        <div className={styles.empty}>No comments yet. Be the first to comment!</div>
      )}

      {visibleThreads.map(thread => {
        const threadExpanded = expandedThreads.has(thread.root.id);
        const visibleReplies = threadExpanded
          ? thread.replies
          : thread.replies.slice(0, VISIBLE_REPLIES_BY_DEFAULT);
        const hiddenReplies = thread.replies.length - visibleReplies.length;
        return (
          <div key={thread.root.id} className={styles.thread}>
            {renderComment(thread.root, thread.root.id)}
            {thread.replies.length > 0 && (
            <div className={styles.replies}>
              {visibleReplies.map(reply => (
                <React.Fragment key={reply.id}>
                  {renderComment(reply, thread.root.id)}
                </React.Fragment>
              ))}
              {hiddenReplies > 0 && (
                <ShowMoreReplies threadId={thread.root.id} hiddenCount={hiddenReplies} onExpand={expandThread}/>
              )}
            </div>
          )}
            {replyingTo === thread.root.id && (
            <div className={styles.replyComposer} ref={replyComposerRef}>
              {currentUser && (
                <Avatar name={currentUser.fullName} avatarUrl={currentUser.avatarUrl} size={28}/>
              )}
              <input
                className={styles.replyField}
                aria-label="Reply"
                value={replyText}
                onChange={handleReplyChange}
                onKeyDown={handleReplyKeyDown}
                placeholder={`Reply to ${thread.root.author.fullName}… · Enter to send, Esc to cancel`}
                disabled={replySubmitting}
                autoFocus
              />
            </div>
          )}
          </div>
        );
      })}

      {hiddenCount > 0 && (
        <button type="button" className={styles.showMore} onClick={showAllThreads}>
          Show {hiddenCount} more {hiddenCount === 1 ? 'comment' : 'comments'}
        </button>
      )}
    </section>
  );
};
