import {beforeEach, describe, expect, it} from 'vitest';

import {clearPostCache, rememberPosts} from '../../data/articles/post-cache';
import {loadProjectIndex} from '../../data/articles/project-index';
import {YtArticlesRepository} from '../../data/articles/yt-articles-repository';
import type {BlogPost} from '../../data/types';
import {createBlogHost, nextProject} from '../../test/blog-host';
import {blog, post} from '../../test/fake-host';
import {mergeFirstPage, readFeedSeed} from './feed-seed';

const general = blog('b1', 'General', 1);
const FIRST_PAGE = 5;

const make = (id: string): BlogPost => ({
  id,
  idReadable: `P-${id}`,
  summary: `Post ${id}`,
  content: '',
  created: 1,
  updated: 1,
  author: {login: 'ann', fullName: 'Ann', avatarUrl: '', ringId: ''},
  parentArticle: null,
  tags: [],
  commentsCount: 0,
  hasStar: false,
  topComment: null,
  topCommentReplies: 0,
});

describe('mergeFirstPage', () => {
  const known = (...ids: string[]) => new Set(ids);

  it('puts the fresh first page in front and keeps the pages loaded after it', () => {
    const merged = mergeFirstPage([make('a'), make('b'), make('c'), make('d')], [make('a'), make('b')], known('a', 'b', 'c', 'd'));
    expect(merged.map(item => item.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('shows a new post on top without duplicating the posts it pushed down', () => {
    const merged = mergeFirstPage([make('a'), make('b'), make('c')], [make('n'), make('a')], known('n', 'a', 'b', 'c'));
    expect(merged.map(item => item.id)).toEqual(['n', 'a', 'b', 'c']);
  });

  it('drops a post that no longer exists', () => {
    const merged = mergeFirstPage([make('a'), make('b'), make('c')], [make('a')], known('a', 'c'));
    expect(merged.map(item => item.id)).toEqual(['a', 'c']);
  });

  it('takes the content of the fresh copy', () => {
    const fresh = {...make('a'), summary: 'Renamed'};
    expect(mergeFirstPage([make('a')], [fresh], known('a'))[0].summary).toBe('Renamed');
  });

  it('returns the fresh page when nothing was shown before', () => {
    expect(mergeFirstPage([], [make('a'), make('b')], known('a', 'b')).map(item => item.id)).toEqual(['a', 'b']);
  });
});

describe('readFeedSeed', () => {
  beforeEach(clearPostCache);

  const fixturePosts = Array.from({length: 8}, (_unused, index) => post(`s${index + 1}`, general, 100 + index, {summary: `Post ${index + 1}`}));

  async function loadedHost() {
    const fake = createBlogHost({blogs: [general], posts: fixturePosts});
    const project = nextProject();
    await loadProjectIndex(fake.host, project);
    return {fake, project};
  }

  it('is null while the project index is not loaded', () => {
    expect(readFeedSeed(nextProject(), 'b1', FIRST_PAGE)).toBeNull();
  });

  it('has the summary but no posts while the first page is not cached', async () => {
    const {project} = await loadedHost();
    const seed = readFeedSeed(project, 'b1', FIRST_PAGE);
    expect(seed?.summary).toHaveLength(8);
    expect(seed?.posts).toBeNull();
  });

  it('has the first page once every post of it is cached, newest first', async () => {
    const {project} = await loadedHost();
    rememberPosts(['s8', 's7', 's6', 's5', 's4'].map(make));
    const seed = readFeedSeed(project, 'b1', FIRST_PAGE);
    expect(seed?.posts?.map(item => item.id)).toEqual(['s8', 's7', 's6', 's5', 's4']);
  });

  it('is not complete when one post of the first page is missing', async () => {
    const {project} = await loadedHost();
    rememberPosts(['s8', 's7', 's6', 's5'].map(make));
    expect(readFeedSeed(project, 'b1', FIRST_PAGE)?.posts).toBeNull();
  });

  it('lists the same posts in the same order as the first page the feed fetches', async () => {
    const {fake, project} = await loadedHost();
    const fetched = await new YtArticlesRepository(fake.host).getPostsPage('b1', 0, FIRST_PAGE, 8);
    rememberPosts(fetched);
    const seed = readFeedSeed(project, 'b1', FIRST_PAGE);
    expect(seed?.posts?.map(item => item.id)).toEqual(fetched.map(item => item.id));
  });
});
