import React from 'react';

import type {Author, BlogPost, PostReaction} from '../../data/types';
import type {ReactionsByPost} from '../../data/post-reactions/post-reactions-repository';
import {useNavigation} from '../../routing/navigation';
import {PostCard} from '../post-card/post-card';

import styles from './post-list.module.css';

const EAGER_CARDS = 2;

interface PostListProps {
  posts: readonly BlogPost[];
  currentUser: Author | null;
  reactionsByPost: ReactionsByPost;
  blogNameOf?: (post: BlogPost) => string | undefined;
  onAuthorClick: (login: string) => void;
  onToggleStar: (postId: string, hasStar: boolean) => void;
  onToggleReaction: (postId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
}

interface PostListItemProps {
  post: BlogPost;
  blogName?: string;
  currentUser: Author | null;
  reactions?: readonly PostReaction[];
  priority: boolean;
  onAuthorClick: (login: string) => void;
  onToggleStar: (postId: string, hasStar: boolean) => void;
  onToggleReaction: (postId: string, reaction: string, ownReactionId: string | null) => Promise<void>;
}

const PostListItem: React.FunctionComponent<PostListItemProps> = ({post, blogName, currentUser, reactions, priority, onAuthorClick, onToggleStar, onToggleReaction}) => {
  const {goToPost, goToComments} = useNavigation();
  const handleOpen = () => goToPost(post.id, undefined, post.summary);
  const handleComments = () => goToComments(post.id, post.summary);
  const handleReply = (postId: string, commentId: string) => goToPost(postId, commentId, post.summary);
  return (
    <PostCard
      post={post}
      blogName={blogName}
      currentUser={currentUser}
      reactions={reactions}
      priority={priority}
      onClick={handleOpen}
      onCommentsClick={handleComments}
      onAuthorClick={onAuthorClick}
      onToggleStar={onToggleStar}
      onToggleReaction={onToggleReaction}
      onReplyClick={handleReply}
    />
  );
};

export const PostList: React.FunctionComponent<PostListProps> = ({
  posts,
  currentUser,
  reactionsByPost,
  blogNameOf,
  onAuthorClick,
  onToggleStar,
  onToggleReaction,
}) => (
  <div className={styles.posts}>
    {posts.map((post, index) => (
      <PostListItem
        key={post.id}
        post={post}
        priority={index < EAGER_CARDS}
        blogName={blogNameOf?.(post)}
        currentUser={currentUser}
        reactions={reactionsByPost[post.id]}
        onAuthorClick={onAuthorClick}
        onToggleStar={onToggleStar}
        onToggleReaction={onToggleReaction}
      />
    ))}
  </div>
);
