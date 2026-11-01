import type {HostAPI} from '../../api/host';
import {isBlogPost} from '../articles/blog-post';
import {fetchAllPages} from '../fetch-all-pages';
import type {BlogConfig, BookmarkedPost} from '../types';

interface YTBookmarkedArticle {
  id: string;
  summary: string;
  created: number;
  reporter: {login: string; fullName: string};
  parentArticle: {id: string; summary: string; parentArticle: {id: string} | null} | null;
}

const BOOKMARK_FIELDS = 'id,summary,created,reporter(login,fullName),parentArticle(id,summary,parentArticle(id))';

export async function fetchBookmarkedPosts(host: HostAPI, config: BlogConfig): Promise<readonly BookmarkedPost[]> {
  const query = encodeURIComponent(`project: {${config.projectShortName}} has: star`);
  const articles = await fetchAllPages<YTBookmarkedArticle>(host, `articles?fields=${BOOKMARK_FIELDS}&query=${query}`);
  return articles
    .filter(isBlogPost)
    .map(article => ({
      id: article.id,
      summary: article.summary,
      author: article.reporter.fullName || article.reporter.login,
      blogName: article.parentArticle?.summary ?? '',
      created: article.created,
    }))
    .sort((a, b) => b.created - a.created);
}
