import React from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import type {BlogConfig} from '../../data/types';
import {useNavigation} from '../../routing/navigation';
import {PostList} from '../../components/post-list/post-list';
import {ListLayout} from '../../components/post-list/list-layout';
import {PostCardSkeletons} from '../../components/post-card/post-card-skeleton';
import {TrendingSidebar} from '../../components/trending-sidebar/trending-sidebar';
import {ErrorState} from '../../components/error-state/error-state';
import {useCurrentUser} from '../../data/users/use-current-user';
import {useInfiniteScroll} from '../../hooks/use-infinite-scroll';
import {useMinDuration} from '../../hooks/use-min-duration';
import {MIN_PLACEHOLDER_MS} from '../../config/constants';
import {usePrefetchPostPage} from '../post/lazy-post-page';
import {useFeed} from './use-feed';

import styles from './feed-page.module.css';

interface FeedPageProps {
  blogId: string;
  config: BlogConfig;
}

export const FeedPage: React.FunctionComponent<FeedPageProps> = ({blogId, config}) => {
  const {goToPost, goToAuthor} = useNavigation();
  const {
    posts,
    trendingPosts,
    reactionsByPost,
    reactionsLoading,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    loadMoreFailed,
    retry,
    toggleStar,
    togglePostReaction,
  } = useFeed(blogId, config);
  const currentUser = useCurrentUser();
  const showPageLoading = useMinDuration(loading, MIN_PLACEHOLDER_MS);
  const sentinelRef = useInfiniteScroll(hasMore && !loadMoreFailed, loadMore, posts.length);
  usePrefetchPostPage(posts.length > 0);

  if (error) {
    return <ErrorState message={error} onRetry={retry}/>;
  }

  if (showPageLoading) {
    return (
      <ListLayout
        sidebar={<TrendingSidebar loading={trendingPosts.length === 0 || reactionsLoading} posts={trendingPosts} reactionsByPost={reactionsByPost} onPostClick={goToPost}/>}
      >
        <PostCardSkeletons/>
      </ListLayout>
    );
  }

  const showEmpty = posts.length === 0 && !loadingMore;

  return (
    <ListLayout
      sentinelRef={hasMore ? sentinelRef : undefined}
      sidebar={<TrendingSidebar loading={reactionsLoading} posts={trendingPosts} reactionsByPost={reactionsByPost} onPostClick={goToPost}/>}
    >
      {showEmpty ? (
        <div className={styles.empty}>
          No posts yet. Create the first one!
        </div>
      ) : (
        <PostList
          posts={posts}
          currentUser={currentUser}
          reactionsByPost={reactionsByPost}
          onAuthorClick={goToAuthor}
          onToggleStar={toggleStar}
          onToggleReaction={togglePostReaction}
        />
      )}

      {loadingMore && (
        <div className={styles.loadingMore} role="status">Loading more…</div>
      )}

      {loadMoreFailed && (
        <div className={styles.loadingMore}>
          <Button text onClick={loadMore}>Retry loading more posts</Button>
        </div>
      )}
    </ListLayout>
  );
};
