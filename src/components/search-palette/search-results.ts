import type {BookmarkedPost, SearchIndexPost} from '../../data/types';
import type {PulseNavItem} from '../../lib/nav-item';
import type {PersonEntry, CommentEntry} from './search-types';

export type Scope = 'all' | 'posts' | 'people' | 'comments' | 'bookmarks' | 'categories';

export const SCOPES: readonly Scope[] = ['all', 'posts', 'people', 'comments', 'bookmarks', 'categories'];

export const SCOPE_LABELS: Readonly<Record<Scope, string>> = {
  all: 'All',
  posts: 'Posts',
  people: 'People',
  comments: 'Comments',
  bookmarks: 'Bookmarks',
  categories: 'Categories',
};

export interface SearchResults {
  posts: readonly SearchIndexPost[];
  people: readonly PersonEntry[];
  comments: readonly CommentEntry[];
  bookmarks: readonly BookmarkedPost[];
  categories: readonly PulseNavItem[];
  counts: Readonly<Record<Scope, number>>;
}

export type SearchRow =
  | {key: string; kind: 'post'; post: SearchIndexPost}
  | {key: string; kind: 'person'; person: PersonEntry}
  | {key: string; kind: 'comment'; comment: CommentEntry}
  | {key: string; kind: 'bookmark'; bookmark: BookmarkedPost}
  | {key: string; kind: 'category'; category: PulseNavItem};

const ALL_VIEW_LIMIT: Readonly<Record<Exclude<Scope, 'all'>, number>> = {
  posts: 5,
  people: 4,
  comments: 5,
  bookmarks: 5,
  categories: 4,
};

const SCOPED_VIEW_LIMIT = 50;

export function toRows(results: SearchResults, scope: Scope): readonly SearchRow[] {
  const rows: SearchRow[] = [];

  const pushPosts = (limit: number): void => {
    results.posts.slice(0, limit).forEach(post => rows.push({key: `post:${post.id}`, kind: 'post', post}));
  };
  const pushPeople = (limit: number): void => {
    results.people.slice(0, limit).forEach(person => rows.push({key: `person:${person.login}`, kind: 'person', person}));
  };
  const pushComments = (limit: number): void => {
    results.comments.slice(0, limit).forEach(comment => rows.push({key: `comment:${comment.id}`, kind: 'comment', comment}));
  };

  const pushBookmarks = (limit: number): void => {
    results.bookmarks.slice(0, limit).forEach(bookmark => rows.push({key: `bookmark:${bookmark.id}`, kind: 'bookmark', bookmark}));
  };

  const pushCategories = (limit: number): void => {
    results.categories.slice(0, limit).forEach(category => rows.push({key: `category:${category.id}`, kind: 'category', category}));
  };

  if (scope === 'categories') {
    pushCategories(SCOPED_VIEW_LIMIT);
  } else if (scope === 'bookmarks') {
    pushBookmarks(SCOPED_VIEW_LIMIT);
  } else if (scope === 'posts') {
    pushPosts(SCOPED_VIEW_LIMIT);
  } else if (scope === 'people') {
    pushPeople(SCOPED_VIEW_LIMIT);
  } else if (scope === 'comments') {
    pushComments(SCOPED_VIEW_LIMIT);
  } else {
    pushPosts(ALL_VIEW_LIMIT.posts);
    pushPeople(ALL_VIEW_LIMIT.people);
    pushComments(ALL_VIEW_LIMIT.comments);
    pushBookmarks(ALL_VIEW_LIMIT.bookmarks);
    pushCategories(ALL_VIEW_LIMIT.categories);
  }

  return rows;
}

export function matchBookmarks(bookmarks: readonly BookmarkedPost[], needle: string): readonly BookmarkedPost[] {
  return needle ? bookmarks.filter(post => `${post.summary} ${post.author} ${post.blogName}`.toLowerCase().includes(needle)) : bookmarks;
}

export function matchCategories(categories: readonly PulseNavItem[], needle: string): readonly PulseNavItem[] {
  return needle ? categories.filter(item => item.label.toLowerCase().includes(needle)) : categories;
}

export function withLocalEntries(
  results: SearchResults,
  bookmarks: readonly BookmarkedPost[],
  categories: readonly PulseNavItem[],
): SearchResults {
  return {
    ...results,
    bookmarks,
    categories,
    counts: {
      ...results.counts,
      all: results.counts.all + bookmarks.length + categories.length,
      bookmarks: bookmarks.length,
      categories: categories.length,
    },
  };
}
