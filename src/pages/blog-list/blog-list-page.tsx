import React, {useState, useEffect} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Text from '@jetbrains/ring-ui-built/components/text/text';

import type {BlogConfig, BlogPost, MagazinePostStub} from '../../data/types';
import {useNavigation} from '../../routing/navigation';
import {PostCardSkeletons} from '../../components/post-card/post-card-skeleton';
import {PostList} from '../../components/post-list/post-list';
import {ListLayout} from '../../components/post-list/list-layout';
import {ListSkeleton} from '../../components/post-list/list-skeleton';
import {TrendingSidebar} from '../../components/trending-sidebar/trending-sidebar';
import {ErrorState} from '../../components/error-state/error-state';
import {useCurrentUser} from '../../data/users/use-current-user';
import {useInfiniteScroll} from '../../hooks/use-infinite-scroll';
import {useMinDuration} from '../../hooks/use-min-duration';
import {MIN_PLACEHOLDER_MS, POSTS_PER_PAGE} from '../../config/constants';
import {usePrefetchPostPage} from '../post/lazy-post-page';
import {useMagazine} from './use-magazine';

import styles from './blog-list-page.module.css';

interface BlogListPageProps {
  config: BlogConfig;
  rubricId?: string;
  authorLogin?: string;
}

function isStreamLoading(options: {indexLoading: boolean; filtered: number; visible: number; postsFailed: boolean}): boolean {
  const waitingForPosts = options.filtered > 0 && options.visible === 0 && !options.postsFailed;
  return waitingForPosts || (options.indexLoading && options.filtered === 0);
}

function findAuthorName(posts: readonly BlogPost[], login: string): string {
  return posts.find(post => post.author.login === login)?.author.fullName ?? login;
}

function filterStubs(stubs: readonly MagazinePostStub[], blogId: string | null, authorLogin: string | null): readonly MagazinePostStub[] {
  return stubs.filter(stub => (!blogId || stub.blogId === blogId) && (!authorLogin || stub.authorLogin === authorLogin));
}

export const BlogListPage: React.FunctionComponent<BlogListPageProps> = ({config, rubricId, authorLogin}) => {
  const {goToPost, goToBlogList} = useNavigation();
  const {blogs, stubs, postsById, reactionsByPost, reactionsLoading, loading, indexLoading, error, postsFailed, retry, ensureLoaded, toggleStar, togglePostReaction} = useMagazine(config);
  const currentUser = useCurrentUser();
  const showPageLoading = useMinDuration(loading, MIN_PLACEHOLDER_MS);
  const activeBlogId = rubricId ?? null;
  const authorFilter = authorLogin ?? null;
  const filterKey = `${rubricId ?? ''}|${authorFilter ?? ''}`;
  const [limit, setLimit] = useState({key: filterKey, count: POSTS_PER_PAGE});
  const visibleCount = limit.key === filterKey ? limit.count : POSTS_PER_PAGE;
  const blogNames = new Map(blogs.map(blog => [blog.id, blog.summary]));
  const blogNameOfPost = (post: BlogPost) => (post.parentArticle ? blogNames.get(post.parentArticle.id) : undefined);
  const clearAuthorFilter = () => goToBlogList(rubricId, blogNames.get(rubricId ?? ''));
  const selectAuthor = (login: string) => goToBlogList(rubricId, blogNames.get(rubricId ?? ''), login);

  const filteredStubs = filterStubs(stubs, activeBlogId, authorFilter);

  const visibleStubs = filteredStubs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredStubs.length;
  const loadMore = () => setLimit({key: filterKey, count: visibleCount + POSTS_PER_PAGE});

  useEffect(() => {
    ensureLoaded(visibleStubs);
  }, [visibleStubs, ensureLoaded]);

  const visiblePosts = visibleStubs.map(s => postsById[s.id]).filter((p): p is BlogPost => Boolean(p));
  const sentinelRef = useInfiniteScroll(hasMore, loadMore, visiblePosts.length);
  usePrefetchPostPage(visiblePosts.length > 0);

  const streamLoading = isStreamLoading({indexLoading, filtered: filteredStubs.length, visible: visiblePosts.length, postsFailed});
  const showSkeleton = useMinDuration(streamLoading, MIN_PLACEHOLDER_MS);

  const authorName = authorFilter ? findAuthorName(visiblePosts, authorFilter) : undefined;

  if (error) {
    return <ErrorState message={error} onRetry={retry}/>;
  }

  if (postsFailed && filteredStubs.length > 0 && visiblePosts.length === 0) {
    return <ErrorState message="The posts could not be loaded." onRetry={retry}/>;
  }

  if (showPageLoading) {
    return <ListSkeleton/>;
  }

  if (blogs.length === 0 && !indexLoading) {
    return (
      <div className={styles.empty}>
        <Text size={Text.Size.L}>No Blogs Found</Text>
        <Text size={Text.Size.M} className={styles.emptyText}>
          Create a root-level article in the project &quot;{config.projectName}&quot; to start a blog.
        </Text>
      </div>
    );
  }

  return (
    <>
      {authorFilter && authorName && (
        <div className={styles.authorFilter}>
          Posts by {authorName}
          <Button text onClick={clearAuthorFilter}>Clear filter</Button>
        </div>
      )}

      <ListLayout
        sentinelRef={hasMore ? sentinelRef : undefined}
        sidebar={<TrendingSidebar loading={indexLoading || reactionsLoading} posts={indexLoading ? [] : stubs} reactionsByPost={reactionsByPost} onPostClick={goToPost}/>}
      >
        {showSkeleton && <PostCardSkeletons/>}
        {!showSkeleton && (filteredStubs.length === 0 ? (
          <div className={styles.emptyPosts}>
            {authorFilter ? 'No posts match your filter.' : 'No posts yet.'}
          </div>
        ) : (
          <PostList
            posts={visiblePosts}
            currentUser={currentUser}
            reactionsByPost={reactionsByPost}
            blogNameOf={activeBlogId === null ? blogNameOfPost : undefined}
            onAuthorClick={selectAuthor}
            onToggleStar={toggleStar}
            onToggleReaction={togglePostReaction}
          />
        ))}
      </ListLayout>
    </>
  );
};
