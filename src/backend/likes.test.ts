import {beforeEach, describe, expect, it, vi} from 'vitest';

import type {Article, Project} from '@jetbrains/youtrack-scripting-api/entities';

import {findBlogPost, findBlogPosts} from './likes';

const {search} = vi.hoisted(() => ({search: vi.fn<(query: string) => Set<unknown>>()}));

vi.mock('@jetbrains/youtrack-scripting-api/entities', () => ({Article: {search}}));

const project = {key: 'BLOG'} as Project;

function article(id: string, options: {project?: string; root?: boolean} = {}): Article {
  return {
    id,
    project: {key: options.project ?? 'BLOG'},
    parentArticle: options.root ? null : {id: 'BLOG-A-1'},
  } as unknown as Article;
}

function found(...articles: Article[]) {
  search.mockReturnValue(new Set(articles));
}

function hidden() {
  search.mockImplementation(() => {
    throw new Error("Can't parse search query");
  });
}

beforeEach(() => {
  search.mockReset();
});

describe('findBlogPost', () => {
  it('returns the post the secured search finds in the blog project', () => {
    const post = article('BLOG-A-2');
    found(post);
    expect(findBlogPost(project, 'BLOG-A-2')).toBe(post);
    expect(search).toHaveBeenCalledWith('article id: BLOG-A-2');
  });

  it('returns null when the search fails because the caller cannot see the article', () => {
    hidden();
    expect(findBlogPost(project, 'BLOG-A-6')).toBeNull();
  });

  it('never searches for a value that is not an article id', () => {
    found(article('BLOG-A-2'));
    expect(findBlogPost(project, 'BLOG-A-2 or project: SECRET')).toBeNull();
    expect(findBlogPost(project, '')).toBeNull();
    expect(search).not.toHaveBeenCalled();
  });

  it('matches the id case-insensitively', () => {
    const post = article('BLOG-A-2');
    found(post);
    expect(findBlogPost(project, 'blog-a-2')).toBe(post);
  });

  it('ignores root articles and articles of other projects', () => {
    found(article('BLOG-A-1', {root: true}));
    expect(findBlogPost(project, 'BLOG-A-1')).toBeNull();
    found(article('DEMO-A-3', {project: 'DEMO'}));
    expect(findBlogPost(project, 'DEMO-A-3')).toBeNull();
  });

  it('ignores a different article returned for the query', () => {
    found(article('BLOG-A-3'));
    expect(findBlogPost(project, 'BLOG-A-2')).toBeNull();
  });
});

describe('findBlogPosts', () => {
  it('resolves all visible posts with one search', () => {
    const a = article('BLOG-A-2');
    const b = article('BLOG-A-3');
    found(a, b, article('BLOG-A-1', {root: true}));
    const posts = findBlogPosts(project, ['BLOG-A-2', 'BLOG-A-3', 'BLOG-A-1']);
    expect([...posts.entries()]).toEqual([['BLOG-A-2', a], ['BLOG-A-3', b]]);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('article id: BLOG-A-2, BLOG-A-3, BLOG-A-1');
  });

  it('falls back to one search per id when the batch fails and keeps only the visible posts', () => {
    const visible = article('BLOG-A-2');
    search.mockImplementation((query: string) => {
      if (query === 'article id: BLOG-A-2') {
        return new Set([visible]);
      }
      throw new Error("Can't parse search query");
    });
    const posts = findBlogPosts(project, ['BLOG-A-2', 'BLOG-A-6']);
    expect([...posts.entries()]).toEqual([['BLOG-A-2', visible]]);
    expect(search).toHaveBeenCalledTimes(3);
  });

  it('skips values that are not article ids and searches nothing when none remain', () => {
    expect(findBlogPosts(project, ['nope', 'BLOG-A-2 or project: SECRET']).size).toBe(0);
    expect(search).not.toHaveBeenCalled();
  });
});
