import React from 'react';

import type {PostSummary, PostReaction} from '../../data/types';
import {LIKE_REACTION, MIN_PLACEHOLDER_MS} from '../../config/constants';
import {useMinDuration} from '../../hooks/use-min-duration';
import {HeartGlyph} from '../../icons/icons';

import shimmerStyles from '../skeleton/shimmer.module.css';

import styles from './trending-sidebar.module.css';

interface TrendingSidebarProps {
  posts: readonly PostSummary[];
  reactionsByPost: Readonly<Record<string, readonly PostReaction[]>>;
  onPostClick: (postId: string, replyToCommentId?: string, title?: string) => void;
  loading?: boolean;
}

interface PostLinkProps {
  postId: string;
  title: string;
  className: string;
  onOpen: TrendingSidebarProps['onPostClick'];
  children: React.ReactNode;
}

const PostLink: React.FunctionComponent<PostLinkProps> = ({postId, title, className, onOpen, children}) => {
  const handleClick = () => onOpen(postId, undefined, title);
  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

const MAX_ITEMS = 3;
const bar = (className: string, widthClass: string) => (
  <span className={`${shimmerStyles.shimmer} ${className} ${widthClass}`}/>
);

const TrendingSkeleton: React.FunctionComponent = () => (
  <div className={styles.card} aria-hidden="true">
    <div className={styles.title}>{bar(styles.skeletonTitle, styles.w45)}</div>
    <div className={styles.list}>
      <div className={styles.skeletonRowTall}>
        {bar(styles.skeletonLine, styles.w100)}
        {bar(styles.skeletonLine, styles.w62)}
        {bar(styles.skeletonSub, styles.w40)}
      </div>
      <div className={styles.skeletonRowShort}>
        {bar(styles.skeletonLine, styles.w70)}
        {bar(styles.skeletonSub, styles.w40)}
      </div>
    </div>
  </div>
);

export const TrendingSidebar: React.FunctionComponent<TrendingSidebarProps> = ({posts, reactionsByPost, onPostClick, loading = false}) => {
  const showLoading = useMinDuration(loading, MIN_PLACEHOLDER_MS);
  const trending = posts
    .map(post => ({
      post,
      likes: (reactionsByPost[post.id] ?? []).filter(reaction => reaction.reaction === LIKE_REACTION).length,
    }))
    .filter(({post, likes}) => post.commentsCount > 0 || likes > 0)
    .sort((a, b) => (b.post.commentsCount + b.likes) - (a.post.commentsCount + a.likes))
    .slice(0, MAX_ITEMS);

  return (
    <aside className={styles.aside}>
      {showLoading && <TrendingSkeleton/>}
      {!showLoading && trending.length > 0 && (
        <div className={styles.card}>
          <div className={styles.title}>Popular</div>
          <div className={styles.list}>
            {trending.map(({post, likes}) => (
              <PostLink key={post.id} postId={post.id} title={post.summary} className={styles.item} onOpen={onPostClick}>
                <span className={styles.itemTitle}>{post.summary}</span>
                <span className={styles.sub}>
                  {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                  {' · '}
                  <span className={styles.likeIcon}><HeartGlyph on size={12}/></span>
                  {likes}
                </span>
              </PostLink>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
