import React, {useEffect, useRef} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import type {BlogConfig} from '../../data/types';
import {useNavigation} from '../../routing/navigation';
import {getReadingTimeMinutes} from '../../lib/utils';
import {formatFullDate} from '../../lib/date';
import {Avatar} from '../../components/avatar/avatar';
import {CommentGlyph, HeartGlyph, BookmarkGlyph} from '../../icons/icons';
import {PostContent} from '../../components/post-content/post-content';
import {renderPostContent} from '../../components/post-content/render-post-content';
import {TagList} from '../../components/tag-list/tag-list';
import {CommentSection} from '../../components/comment-section/comment-section';
import {ErrorState} from '../../components/error-state/error-state';
import {useCurrentUser} from '../../data/users/use-current-user';
import {LIKE_REACTION, MIN_PLACEHOLDER_MS} from '../../config/constants';
import {useMinDuration} from '../../hooks/use-min-duration';
import {usePost} from './use-post';
import {PostPageSkeleton} from './post-page-skeleton';

import pillStyles from '../../components/post-actions/pill.module.css';
import styles from './post-page.module.css';

interface PostPageProps {
  postId: string;
  replyToCommentId?: string;
  focusCommentId?: string;
  scrollToComments?: boolean;
  config: BlogConfig;
}

export const PostPage: React.FunctionComponent<PostPageProps> = ({postId, replyToCommentId, focusCommentId, scrollToComments, config}) => {
  const {goToAuthor, goToBlogList} = useNavigation();
  const {
    post,
    comments,
    replyMap,
    postReactions,
    loading,
    commentsLoading,
    error,
    notFound,
    commentsError,
    retry,
    addComment,
    addReply,
    toggleReaction,
    togglePostReaction,
    toggleStar,
  } = usePost(postId, config);
  const currentUser = useCurrentUser();
  const showSkeleton = useMinDuration(loading, MIN_PLACEHOLDER_MS);
  const hearts = postReactions.filter(r => r.reaction === LIKE_REACTION);
  const ownHeart = currentUser ? hearts.find(r => r.authorLogin === currentUser.login) : undefined;
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const scrolledToComments = useRef(false);
  const renderedContent = renderPostContent(post?.content ?? '', config.contextPath);

  useEffect(() => {
    if (scrollToComments && post && !commentsLoading && !showSkeleton && !scrolledToComments.current && commentsRef.current) {
      scrolledToComments.current = true;
      commentsRef.current.scrollIntoView({block: 'start'});
    }
  }, [scrollToComments, post, commentsLoading, showSkeleton]);

  const handleAuthorClick = () => {
    if (post) {
      goToAuthor(post.author.login);
    }
  };
  const handleLike = () => togglePostReaction(LIKE_REACTION, ownHeart?.id ?? null);

  if (notFound) {
    return (
      <ErrorState title="Post not found" message="This post does not exist or was deleted.">
        <Button primary onClick={() => goToBlogList()}>Back to the blog</Button>
      </ErrorState>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry}/>;
  }

  if (showSkeleton || !post) {
    return <PostPageSkeleton/>;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.mainColumn}>
        <article className={styles.hero}>
          <div className={styles.heroHead}>
            <Avatar name={post.author.fullName} avatarUrl={post.author.avatarUrl} size={46}/>
            <div className={styles.who}>
              {post.author.login ? (
                <button
                  type="button"
                  className={styles.authorLink}
                  onClick={handleAuthorClick}
                >
                  {post.author.fullName}
                </button>
              ) : (
                <span className={`${styles.authorLink} ${styles.authorStatic}`}>{post.author.fullName}</span>
              )}
              <div className={styles.sub}>
                {formatFullDate(post.created)}
                {` · ${getReadingTimeMinutes(post.content)} min read`}
              </div>
            </div>
          </div>

          <h1 id="post-title" className={styles.title}>{post.summary}</h1>

          {post.tags.length > 0 && (
            <div className={styles.tags}>
              <TagList tags={post.tags}/>
            </div>
          )}

          <PostContent renderedContent={renderedContent}/>

          <div className={styles.footer}>
            <span className={pillStyles.pill} role="img" aria-label={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}>
              <CommentGlyph/>
              {comments.length > 0 && <span>{comments.length}</span>}
            </span>
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
            <button
              type="button"
              className={`${pillStyles.pill} ${pillStyles.pillRound} ${pillStyles.pillEnd}${post.hasStar ? ` ${pillStyles.pillOn}` : ''}`}
              title={post.hasStar ? 'Bookmarked' : 'Bookmark'}
              aria-label="Bookmark"
              aria-pressed={post.hasStar}
              onClick={toggleStar}
            >
              <BookmarkGlyph on={post.hasStar}/>
            </button>
          </div>
        </article>

        <div ref={commentsRef}>
          {commentsError ? (
            <div className={styles.commentsError} role="status">
              {commentsError} <Button inline onClick={retry}>Retry</Button>
            </div>
          ) : (
            <CommentSection
              comments={comments}
              replyMap={replyMap}
              initialReplyTo={replyToCommentId}
              focusCommentId={focusCommentId}
              loading={commentsLoading}
              postAuthorLogin={post.author.login}
              contextPath={config.contextPath}
              currentUser={currentUser}
              canComment={config.canComment}
              onAddComment={addComment}
              onAddReply={addReply}
              onToggleReaction={toggleReaction}
            />
          )}
        </div>
      </div>

    </div>
  );
};
