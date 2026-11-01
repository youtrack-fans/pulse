import {describe, expect, it} from 'vitest';

import {isBlogPost, toPostStub} from './blog-post';

describe('isBlogPost', () => {
  it('rejects a root article', () => {
    expect(isBlogPost({parentArticle: null})).toBe(false);
  });

  it('accepts a direct child of a root blog', () => {
    expect(isBlogPost({parentArticle: {summary: 'General', parentArticle: null}})).toBe(true);
  });

  it('accepts a child whose parent has no parent field at all', () => {
    expect(isBlogPost({parentArticle: {summary: 'General'}})).toBe(true);
  });

  it('rejects a grandchild', () => {
    expect(isBlogPost({parentArticle: {summary: 'Post', parentArticle: {id: '1-1'}}})).toBe(false);
  });
});

describe('toPostStub', () => {
  const article = {
    id: '1-1',
    idReadable: 'P-A-1',
    summary: 'Title',
    created: 100,
    reporter: {login: 'ad'},
    comments: [{id: 'c1'}, {id: 'c2'}],
  };

  it('maps the article fields to a stub', () => {
    expect(toPostStub(article, 'blog-1')).toEqual({
      id: '1-1',
      idReadable: 'P-A-1',
      created: 100,
      blogId: 'blog-1',
      authorLogin: 'ad',
      summary: 'Title',
      commentsCount: 2,
    });
  });

  it('survives a missing reporter and missing comments', () => {
    expect(toPostStub({...article, reporter: null, comments: null}, 'blog-1')).toMatchObject({
      authorLogin: '',
      commentsCount: 0,
    });
  });
});
