export interface BlogConfig {
  projectName: string;
  projectShortName: string;
  blogName?: string;
  contextPath: string;
  canWrite: boolean;
  canComment: boolean;
}

export interface Blog {
  id: string;
  idReadable: string;
  summary: string;
  childCount: number;
}

export interface PostSummary {
  id: string;
  summary: string;
  commentsCount: number;
}

export interface LatestPosts {
  posts: readonly BlogPost[];
  stubs: readonly MagazinePostStub[];
}

export interface MagazinePostStub {
  id: string;
  idReadable: string;
  created: number;
  blogId: string;
  authorLogin: string;
  summary: string;
  commentsCount: number;
}

export interface Author {
  login: string;
  fullName: string;
  avatarUrl: string;
  ringId: string;
}

export interface BlogPost {
  id: string;
  idReadable: string;
  summary: string;
  content: string;
  created: number;
  updated: number;
  author: Author;
  parentArticle: {
    id: string;
    idReadable: string;
    summary: string;
  } | null;
  tags: readonly ArticleTag[];
  commentsCount: number;
  hasStar: boolean;
  topComment: ArticleComment | null;
  topCommentReplies: number;
}

export interface ArticleTag {
  id: string;
  name: string;
}

export interface ArticleComment {
  id: string;
  text: string;
  created: number;
  author: Author;
  parentCommentId: string | null;
  reactions: readonly CommentReaction[];
}

export interface CommentReaction {
  id: string;
  reaction: string;
  authorLogin: string;
  authorFullName: string;
}

export interface PostReaction {
  id: string;
  reaction: string;
  authorLogin: string;
}

export interface SearchIndexComment {
  id: string;
  text: string;
  created: number;
  author: Author;
}

export interface SearchIndexPost {
  id: string;
  summary: string;
  content: string;
  created: number;
  author: Author;
  blogId: string;
  blogName: string;
  comments: readonly SearchIndexComment[];
}

export interface BookmarkedPost {
  id: string;
  summary: string;
  author: string;
  blogName: string;
  created: number;
}
