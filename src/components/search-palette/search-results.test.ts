import {describe, expect, it} from 'vitest';

import type {BookmarkedPost} from '../../data/types';
import type {PulseNavItem} from '../../lib/nav-item';
import type {SearchResults} from './search-results';
import {matchBookmarks, matchCategories, toRows, withLocalEntries} from './search-results';

const bookmarks: BookmarkedPost[] = [
  {id: 'b1', summary: 'Kotlin tips', author: 'Ann', blogName: 'General', created: 2},
  {id: 'b2', summary: 'Release notes', author: 'Bob', blogName: 'News', created: 1},
];

const categories: PulseNavItem[] = [
  {id: 'c1', label: 'Kotlin', count: 3, active: false, onClick: () => {}},
  {id: 'c2', label: 'News', count: 1, active: true, onClick: () => {}},
];

const empty: SearchResults = {
  posts: [],
  people: [],
  comments: [],
  bookmarks: [],
  categories: [],
  counts: {all: 0, posts: 0, people: 0, comments: 0, bookmarks: 0, categories: 0},
};

describe('bookmarks in search', () => {
  it('filters bookmarks by title, author and blog', () => {
    expect(matchBookmarks(bookmarks, 'kotlin').map(post => post.id)).toEqual(['b1']);
    expect(matchBookmarks(bookmarks, 'bob').map(post => post.id)).toEqual(['b2']);
    expect(matchBookmarks(bookmarks, 'news').map(post => post.id)).toEqual(['b2']);
    expect(matchBookmarks(bookmarks, '')).toHaveLength(2);
  });

  it('adds bookmarks to the counts and to the rows of All and Bookmarks', () => {
    const results = withLocalEntries(empty, bookmarks, []);

    expect(results.counts).toMatchObject({all: 2, bookmarks: 2});
    expect(toRows(results, 'all').map(row => row.key)).toEqual(['bookmark:b1', 'bookmark:b2']);
    expect(toRows(results, 'bookmarks')).toHaveLength(2);
    expect(toRows(results, 'posts')).toHaveLength(0);
  });

  it('filters categories by name and lists them in All and Categories', () => {
    expect(matchCategories(categories, 'kot').map(item => item.id)).toEqual(['c1']);
    expect(matchCategories(categories, '')).toHaveLength(2);

    const results = withLocalEntries(empty, [], categories);

    expect(results.counts).toMatchObject({all: 2, categories: 2});
    expect(toRows(results, 'all').map(row => row.key)).toEqual(['category:c1', 'category:c2']);
    expect(toRows(results, 'categories')).toHaveLength(2);
    expect(toRows(results, 'bookmarks')).toHaveLength(0);
  });
});
