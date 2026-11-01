import type {BlogPost} from '../../data/types';

export type PostsById = Readonly<Record<string, BlogPost>>;

export function mergePosts(previous: PostsById, posts: readonly BlogPost[]): PostsById {
  const next: Record<string, BlogPost> = {...previous};
  posts.forEach(post => {
    next[post.id] = post;
  });
  return next;
}

export function patchPost(previous: PostsById, postId: string, patch: (post: BlogPost) => BlogPost): PostsById {
  const post = previous[postId];
  return post ? {...previous, [postId]: patch(post)} : previous;
}
