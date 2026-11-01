import type {HostAPI} from '../../api/host';
import type {SearchIndexPost, SearchIndexComment} from '../types';
import {extractReplyMarker} from '../articles/comment-reply-marker';
import {mapAuthor} from '../users/map-author';
import type {YTAuthorRef} from '../users/map-author';

type YTSearchReporter = YTAuthorRef;

interface YTSearchComment {
  id: string;
  text: string;
  created: number;
  author: YTSearchReporter;
}

interface YTSearchArticle {
  id: string;
  summary: string;
  created: number;
  reporter: YTSearchReporter;
  parentArticle: {id: string; summary: string} | null;
  comments: readonly YTSearchComment[];
}

interface YTSearchUser {
  login: string;
  fullName: string;
  avatarUrl: string;
}

export interface SearchPersonHit {
  login: string;
  fullName: string;
  avatarUrl: string;
}

const ARTICLE_SEARCH_FIELDS = 'id,summary,created,reporter(login,fullName,avatarUrl,ringId),parentArticle(id,summary),comments(id,text,created,author(login,fullName,avatarUrl,ringId))';
const USER_SEARCH_FIELDS = 'login,fullName,avatarUrl';

function sanitizeQuery(raw: string): string {
  return raw.replace(/[{}()#:"\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripDanglingOperators(text: string): string {
  return text.replace(/^(?:(?:and|or)\b\s*)+/i, '').replace(/(?:\s*\b(?:and|or))+$/i, '').trim();
}

function mapComment(comment: YTSearchComment): SearchIndexComment | null {
  const {text} = extractReplyMarker(comment.text || '');
  if (!text.trim()) {
    return null;
  }
  return {
    id: comment.id,
    text,
    created: comment.created,
    author: mapAuthor(comment.author),
  };
}

function mapArticle(article: YTSearchArticle): SearchIndexPost {
  return {
    id: article.id,
    summary: article.summary,
    content: '',
    created: article.created,
    author: mapAuthor(article.reporter),
    blogId: article.parentArticle?.id ?? '',
    blogName: article.parentArticle?.summary ?? '',
    comments: (article.comments ?? [])
      .map(mapComment)
      .filter((c): c is SearchIndexComment => c !== null),
  };
}

export class YtSearchRepository {
  private readonly host: HostAPI;

  constructor(host: HostAPI) {
    this.host = host;
  }

  async searchPosts(projectShortName: string, rawQuery: string, top: number): Promise<readonly SearchIndexPost[]> {
    return this.searchArticles(projectShortName, rawQuery, top, '');
  }

  async searchCommented(projectShortName: string, rawQuery: string, top: number): Promise<readonly SearchIndexPost[]> {
    return this.searchArticles(projectShortName, rawQuery, top, 'has: comments and ');
  }

  private async searchArticles(projectShortName: string, rawQuery: string, top: number, filter: string): Promise<readonly SearchIndexPost[]> {
    const text = stripDanglingOperators(sanitizeQuery(rawQuery));
    if (!text) {
      return [];
    }
    const query = `project: {${projectShortName}} and ${filter}(${text})`;
    const articles = await this.host.fetchYouTrack<readonly YTSearchArticle[]>(
      `articles?fields=${ARTICLE_SEARCH_FIELDS}&query=${encodeURIComponent(query)}&$top=${top}`
    );
    return articles.filter(article => article.parentArticle).map(mapArticle);
  }

  async searchPeople(rawQuery: string, top: number): Promise<readonly SearchPersonHit[]> {
    const text = sanitizeQuery(rawQuery);
    if (!text) {
      return [];
    }
    const users = await this.host.fetchYouTrack<readonly YTSearchUser[]>(
      `users?fields=${USER_SEARCH_FIELDS}&query=${encodeURIComponent(text)}&$top=${top}`
    );
    return users
      .filter(user => user.login)
      .map(user => ({
        login: user.login,
        fullName: user.fullName || user.login,
        avatarUrl: user.avatarUrl || '',
      }));
  }
}
