import type {Blog, BlogPost, LatestPosts, PostSummary, MagazinePostStub, ArticleComment, CommentReaction} from '../types';

export interface ArticlesRepository {
  getBlogs(projectShortName: string): Promise<readonly Blog[]>;
  getPostStubs(projectShortName: string): Promise<readonly MagazinePostStub[]>;
  getLatestPosts(projectShortName: string, count: number): Promise<LatestPosts>;
  getPostsByReadableIds(idsReadable: readonly string[]): Promise<readonly BlogPost[]>;
  getPostsPage(blogArticleId: string, offset: number, limit: number, total: number): Promise<readonly BlogPost[]>;
  getPostsSummary(projectShortName: string, blogArticleId: string): Promise<readonly PostSummary[]>;
  getPost(articleId: string): Promise<BlogPost>;
  getPostWithComments(articleId: string): Promise<{post: BlogPost; comments: readonly ArticleComment[]}>;
  toggleStar(articleId: string, hasStar: boolean): Promise<void>;
  addComment(articleId: string, text: string, parentCommentId?: string): Promise<ArticleComment>;
  addReaction(articleId: string, commentId: string, reaction: string): Promise<CommentReaction>;
  removeReaction(articleId: string, commentId: string, reactionId: string): Promise<void>;
}
