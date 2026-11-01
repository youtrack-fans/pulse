import type {HostAPI} from '../../api/host';
import type {Blog, BlogPost, ArticleComment, CommentReaction, PostSummary, MagazinePostStub, LatestPosts} from '../types';
import type {ArticlesRepository} from './articles-repository';
import {extractReplyMarker, appendReplyMarker} from './comment-reply-marker';
import {loadProjectIndex} from './project-index';
import {rememberPosts} from './post-cache';
import {toPostSummaries} from './post-summary';
import {PARENT_FIELDS, isBlogPost, toPostStub} from './blog-post';
import {safeDecodeURIComponent} from '../../lib/utils';
import {withImageSize} from '../../lib/image-loading';
import {mapAuthor} from '../users/map-author';
import type {YTAuthorRef} from '../users/map-author';

interface YTArticle {
  id: string;
  idReadable: string;
  summary: string;
  content: string;
  created: number;
  updated: number;
  reporter: YTAuthorRef;
  parentArticle: {
    id: string;
    idReadable: string;
    summary: string;
    parentArticle?: {id: string} | null;
  } | null;
  childArticles: readonly { id: string }[];
  tags: readonly { id: string; name: string }[];
  attachments?: readonly { name: string; url: string; metaData?: string }[];
  comments: readonly YTComment[];
  hasStar: boolean;
}

interface YTComment {
  id: string;
  text: string;
  created: number;
  author: YTAuthorRef;
  reactions?: readonly YTReaction[];
}

interface YTReaction {
  id: string;
  reaction: string;
  author: {
    login: string;
    fullName: string;
  };
}

const COMMENT_FIELDS = 'id,text,created,author(login,fullName,avatarUrl,ringId),reactions(id,reaction,author(login,fullName))';
const ARTICLE_FIELDS = `id,idReadable,summary,content,created,updated,hasStar,reporter(login,fullName,avatarUrl,ringId),${PARENT_FIELDS},childArticles(id),tags(id,name),attachments(name,url,metaData),comments(${COMMENT_FIELDS})`;

const LATEST_MAX_PAGES = 10;
const LATEST_PAGE_MARGIN = 2;
const TOP_COMMENT_MIN_LIKES = 6;
const TOP_COMMENT_MIN_REPLIES = 4;

function countRepliesByParent(comments: readonly ArticleComment[]): Map<string, number> {
  const counts = new Map<string, number>();
  comments.forEach(comment => {
    if (comment.parentCommentId) {
      counts.set(comment.parentCommentId, (counts.get(comment.parentCommentId) ?? 0) + 1);
    }
  });
  return counts;
}

function selectTopComment(
  comments: readonly ArticleComment[],
  replyCountByParent: Map<string, number>,
): {comment: ArticleComment; replies: number} | null {
  const candidates = comments
    .filter(comment => !comment.parentCommentId && comment.text)
    .map(comment => ({
      comment,
      likes: comment.reactions.length,
      replies: replyCountByParent.get(comment.id) ?? 0,
    }))
    .filter(({likes, replies}) => likes >= TOP_COMMENT_MIN_LIKES || replies >= TOP_COMMENT_MIN_REPLIES)
    .sort((a, b) => (b.likes + b.replies) - (a.likes + a.replies) || b.comment.created - a.comment.created);
  const best = candidates.length > 0 ? candidates[0] : null;
  return best ? {comment: best.comment, replies: best.replies} : null;
}

function resolveAttachmentImages(content: string, attachments: YTArticle['attachments']): string {
  if (!attachments || attachments.length === 0) {
    return content;
  }
  const urlByName = new Map(attachments.map(attachment => [attachment.name, withImageSize(attachment.url, attachment.metaData)]));
  return content.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (match, alt, target) => {
    const url = urlByName.get(safeDecodeURIComponent(target));
    return url ? `![${alt}](${url})` : match;
  });
}

function summarizeComments(article: YTArticle): Pick<BlogPost, 'commentsCount' | 'topComment' | 'topCommentReplies'> {
  const comments = (article.comments ?? []).map(mapComment);
  const top = selectTopComment(comments, countRepliesByParent(comments));
  return {
    commentsCount: comments.length,
    topComment: top ? top.comment : null,
    topCommentReplies: top ? top.replies : 0,
  };
}

function mapPost(article: YTArticle): BlogPost {
  return {
    id: article.id,
    idReadable: article.idReadable,
    summary: article.summary,
    content: resolveAttachmentImages(article.content || '', article.attachments),
    created: article.created,
    updated: article.updated,
    author: mapAuthor(article.reporter),
    parentArticle: article.parentArticle,
    tags: article.tags ?? [],
    hasStar: article.hasStar ?? false,
    ...summarizeComments(article),
  };
}

function mapPosts(articles: readonly YTArticle[]): BlogPost[] {
  const posts = articles.map(mapPost);
  rememberPosts(posts);
  return posts;
}

function mapComment(comment: YTComment): ArticleComment {
  const {text, parentCommentId} = extractReplyMarker(comment.text || '');
  return {
    id: comment.id,
    text,
    created: comment.created,
    author: mapAuthor(comment.author),
    parentCommentId,
    reactions: (comment.reactions ?? []).map(mapReaction),
  };
}

function mapReaction(reaction: YTReaction): CommentReaction {
  return {
    id: reaction.id,
    reaction: reaction.reaction,
    authorLogin: reaction.author.login,
    authorFullName: reaction.author.fullName || reaction.author.login,
  };
}

export class YtArticlesRepository implements ArticlesRepository {
  private readonly host: HostAPI;

  constructor(host: HostAPI) {
    this.host = host;
  }

  async getBlogs(projectShortName: string): Promise<readonly Blog[]> {
    return (await loadProjectIndex(this.host, projectShortName)).blogs;
  }

  async getPostStubs(projectShortName: string): Promise<readonly MagazinePostStub[]> {
    return (await loadProjectIndex(this.host, projectShortName)).stubs;
  }

  async getLatestPosts(projectShortName: string, count: number): Promise<LatestPosts> {
    const query = encodeURIComponent(`project: {${projectShortName}} sort by: created desc`);
    const pageSize = count + LATEST_PAGE_MARGIN;
    const posts: YTArticle[] = [];
    for (let page = 0; page < LATEST_MAX_PAGES && posts.length < count; page++) {
      const articles = await this.host.fetchYouTrack<readonly YTArticle[]>(
        `articles?fields=${ARTICLE_FIELDS}&query=${query}&$skip=${page * pageSize}&$top=${pageSize}`
      );
      posts.push(...articles.filter(isBlogPost));
      if (articles.length < pageSize) {
        break;
      }
    }
    const latest = posts.slice(0, count);
    return {
      posts: mapPosts(latest),
      stubs: latest.map(article => toPostStub(article, article.parentArticle?.id ?? '')),
    };
  }

  async getPostsByReadableIds(idsReadable: readonly string[]): Promise<readonly BlogPost[]> {
    if (idsReadable.length === 0) {
      return [];
    }
    const query = encodeURIComponent(`article id: ${idsReadable.join(', ')}`);
    const posts = await this.host.fetchYouTrack<readonly YTArticle[]>(
      `articles?fields=${ARTICLE_FIELDS}&query=${query}&$top=${idsReadable.length}`
    );
    return mapPosts(posts);
  }

  async getPostsPage(blogArticleId: string, offset: number, limit: number, total: number): Promise<readonly BlogPost[]> {
    const top = Math.min(limit, total - offset);
    if (top <= 0) {
      return [];
    }
    const skip = Math.max(0, total - offset - limit);
    const posts = await this.host.fetchYouTrack<readonly YTArticle[]>(
      `articles/${blogArticleId}/childArticles?fields=${ARTICLE_FIELDS}&$skip=${skip}&$top=${top}`
    );
    return mapPosts(posts).reverse();
  }

  async getPostsSummary(projectShortName: string, blogArticleId: string): Promise<readonly PostSummary[]> {
    const {stubs} = await loadProjectIndex(this.host, projectShortName);
    return toPostSummaries(stubs, blogArticleId);
  }

  async getPost(articleId: string): Promise<BlogPost> {
    return (await this.getPostWithComments(articleId)).post;
  }

  async getPostWithComments(articleId: string): Promise<{post: BlogPost; comments: readonly ArticleComment[]}> {
    const article = await this.host.fetchYouTrack<YTArticle>(
      `articles/${articleId}?fields=${ARTICLE_FIELDS}`
    );

    return {post: mapPosts([article])[0], comments: (article.comments ?? []).map(mapComment)};
  }

  async toggleStar(articleId: string, hasStar: boolean): Promise<void> {
    await this.host.fetchYouTrack(
      `articles/${articleId}`,
      {
        method: 'POST',
        body: {hasStar},
        headers: {'Content-Type': 'application/json'},
      }
    );
  }

  async addComment(articleId: string, text: string, parentCommentId?: string): Promise<ArticleComment> {
    const storedText = parentCommentId ? appendReplyMarker(text, parentCommentId) : text;
    const comment = await this.host.fetchYouTrack<YTComment>(
      `articles/${articleId}/comments`,
      {
        method: 'POST',
        body: {text: storedText},
        headers: {'Content-Type': 'application/json'},
        query: {fields: COMMENT_FIELDS},
      }
    );

    return mapComment(comment);
  }

  async addReaction(articleId: string, commentId: string, reaction: string): Promise<CommentReaction> {
    const created = await this.host.fetchYouTrack<YTReaction>(
      `articles/${articleId}/comments/${commentId}/reactions`,
      {
        method: 'POST',
        body: {reaction},
        headers: {'Content-Type': 'application/json'},
        query: {fields: 'id,reaction,author(login,fullName)'},
      }
    );

    return mapReaction(created);
  }

  async removeReaction(articleId: string, commentId: string, reactionId: string): Promise<void> {
    await this.host.fetchYouTrack(
      `articles/${articleId}/comments/${commentId}/reactions/${reactionId}`,
      {method: 'DELETE'}
    );
  }
}
