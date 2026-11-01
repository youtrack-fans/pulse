import React from 'react';

import type {Author, BlogPost, PostReaction} from '../../data/types';
import {getSnippet, getReadingTimeMinutes, getFirstImageUrl} from '../../lib/utils';
import {formatFullDate} from '../../lib/date';
import {Avatar} from '../avatar/avatar';
import {Badge} from '../badge/badge';
import {CommentGlyph, BookmarkGlyph, HeartGlyph} from '../../icons/icons';
import {MentionText} from '../mention-text/mention-text';
import {LIKE_REACTION} from '../../config/constants';

import {SmoothImage} from '../smooth-image/smooth-image';

import pillStyles from '../post-actions/pill.module.css';
import styles from './post-card.module.css';

const TOP_COMMENT_SNIPPET_LENGTH = 140;

interface PostCardProps {
  post: BlogPost;
  blogName?: string;
  currentUser?: Author | null;
  reactions?: readonly PostReaction[];
  priority?: boolean;
  onClick: () => void;
  onCommentsClick: () => void;
  onAuthorClick?: (login: string) => void;
  onToggleStar?: (postId: string, hasStar: boolean) => void;
  onToggleReaction?: (postId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
  onReplyClick?: (postId: string, commentId: string) => void;
}

export const PostCard: React.FunctionComponent<PostCardProps> = ({
  post,
  blogName,
  currentUser,
  reactions,
  priority = false,
  onClick,
  onCommentsClick,
  onAuthorClick,
  onToggleStar,
  onToggleReaction,
  onReplyClick,
}) => {
  const imageUrl = getFirstImageUrl(post.content);
  const hearts = (reactions ?? []).filter(r => r.reaction === LIKE_REACTION);
  const ownHeart = currentUser ? hearts.find(r => r.authorLogin === currentUser.login) : undefined;

  const handleAuthorClick = () => onAuthorClick?.(post.author.login);
  const handleLike = () => onToggleReaction?.(post.id, LIKE_REACTION, ownHeart?.id ?? null);
  const handleStar = () => onToggleStar?.(post.id, !post.hasStar);
  const handleReply = () => {
    if (post.topComment) {
      onReplyClick?.(post.id, post.topComment.id);
    }
  };

  return (
    <article className={styles.card}>
      <div className={imageUrl ? `${styles.content} ${styles.contentWithMedia}` : styles.content}>
        <div className={styles.head}>
          <Avatar name={post.author.fullName} avatarUrl={post.author.avatarUrl} size={42}/>
          <div className={styles.who}>
            <div className={styles.authorLine}>
              {post.author.login ? (
                <button
                  type="button"
                  className={styles.authorName}
                  onClick={handleAuthorClick}
                >
                  {post.author.fullName}
                </button>
              ) : (
                <span className={`${styles.authorName} ${styles.authorStatic}`}>{post.author.fullName}</span>
              )}
              {blogName && <Badge>{blogName}</Badge>}
            </div>
            <div className={styles.sub}>{formatFullDate(post.created)} · {getReadingTimeMinutes(post.content)} min read</div>
          </div>
        </div>

        <h2 className={styles.title}>
          <button type="button" className={styles.titleButton} onClick={onClick}>{post.summary}</button>
        </h2>
        <p className={styles.excerpt}>{getSnippet(post.content)}</p>
      </div>

      {imageUrl && (
        <div className={styles.media}>
          <SmoothImage src={imageUrl} priority={priority}/>
        </div>
      )}

      <div className={styles.bottomContent}>
        <div className={styles.actionsRow}>
          <button type="button" className={pillStyles.pill} aria-label={`${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'}`} onClick={onCommentsClick}>
            <CommentGlyph/>
            {post.commentsCount > 0 && <span aria-hidden="true">{post.commentsCount}</span>}
          </button>
          {onToggleReaction && (
            <button
              type="button"
              className={ownHeart ? `${pillStyles.pill} ${pillStyles.pillOn}` : pillStyles.pill}
              title={ownHeart ? 'Unlike' : 'Like'}
              aria-label="Like"
              aria-pressed={Boolean(ownHeart)}
              onClick={handleLike}
            >
              <HeartGlyph on={Boolean(ownHeart)}/>
              {hearts.length > 0 && <span>{hearts.length}</span>}
            </button>
          )}
          <button
            type="button"
            className={`${pillStyles.pill} ${pillStyles.pillRound} ${pillStyles.pillEnd}${post.hasStar ? ` ${pillStyles.pillOn}` : ''}`}
            title={post.hasStar ? 'Bookmarked' : 'Bookmark'}
            aria-label="Bookmark"
            aria-pressed={post.hasStar}
            onClick={handleStar}
          >
            <BookmarkGlyph on={post.hasStar}/>
          </button>
        </div>

        {post.topComment && (
          <div className={styles.inlineComment}>
            <Avatar name={post.topComment.author.fullName} avatarUrl={post.topComment.author.avatarUrl} size={28}/>
            <div className={styles.inlineBody}>
              <div className={styles.inlineText}>
                <span className={styles.inlineName}>{post.topComment.author.fullName}</span>
                <MentionText text={getSnippet(post.topComment.text, TOP_COMMENT_SNIPPET_LENGTH)}/>
              </div>
              <div className={styles.inlineMeta}>
                <span className={styles.like}>
                  <HeartGlyph on={false} size={14}/>
                  {post.topComment.reactions.length > 0 && (
                    <span>{post.topComment.reactions.length}</span>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.replyBtn}
                  onClick={handleReply}
                >
                  Reply
                </button>
                {post.topCommentReplies > 0 && (
                  <span className={styles.repliesLink}>
                    {post.topCommentReplies} {post.topCommentReplies === 1 ? 'reply' : 'replies'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
