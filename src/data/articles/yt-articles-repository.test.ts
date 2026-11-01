import {describe, expect, it} from 'vitest';

import {blog, createArticlesFake, createFakeHost, post, toApiArticle, type FakeArticle} from '../../test/fake-host';
import {loadProjectIndex} from './project-index';
import {YtArticlesRepository} from './yt-articles-repository';

let projectCounter = 0;
const nextProject = () => `LATEST${projectCounter++}`;

const general = blog('b1', 'General', 1);

function roots(count: number, createdFrom: number): FakeArticle[] {
  return Array.from({length: count}, (_unused, index) => blog(`root-${index}`, `Blog ${index}`, createdFrom + index));
}

function posts(count: number, createdFrom: number): FakeArticle[] {
  return Array.from({length: count}, (_unused, index) => post(`p${index}`, general, createdFrom + index));
}

describe('getLatestPosts', () => {
  it('returns the newest posts first', async () => {
    const {host} = createArticlesFake([general, ...posts(15, 100)]);

    const latest = await new YtArticlesRepository(host).getLatestPosts(nextProject(), 10);

    expect(latest.posts.map(item => item.id)).toEqual(['p14', 'p13', 'p12', 'p11', 'p10', 'p9', 'p8', 'p7', 'p6', 'p5']);
    expect(latest.stubs.map(stub => stub.id)).toEqual(latest.posts.map(item => item.id));
  });

  it('keeps paging when the newest items are root articles', async () => {
    const {host, calls} = createArticlesFake([general, ...posts(30, 100), ...roots(25, 1000)]);

    const latest = await new YtArticlesRepository(host).getLatestPosts(nextProject(), 10);

    expect(latest.posts).toHaveLength(10);
    expect(latest.posts.every(item => item.parentArticle?.id === 'b1')).toBe(true);
    expect(calls.length).toBeGreaterThan(1);
  });

  it('leaves out grandchildren', async () => {
    const child = post('c1', general, 50);
    const grandchild = post('g1', blog('c1', 'Post c1', 50), 60, {parent: {id: 'c1', summary: 'Post c1', parentId: 'b1'}});
    const {host} = createArticlesFake([general, child, grandchild]);

    const latest = await new YtArticlesRepository(host).getLatestPosts(nextProject(), 10);

    expect(latest.posts.map(item => item.id)).toEqual(['c1']);
  });

  it('stops after a short page when there are fewer posts than requested', async () => {
    const {host, calls} = createArticlesFake([general, ...posts(3, 100)]);

    const latest = await new YtArticlesRepository(host).getLatestPosts(nextProject(), 10);

    expect(latest.posts).toHaveLength(3);
    expect(calls).toHaveLength(1);
  });

  it('gives up after ten pages when the project holds no posts at the top', async () => {
    const {host, calls} = createArticlesFake(roots(300, 1));

    const latest = await new YtArticlesRepository(host).getLatestPosts(nextProject(), 10);

    expect(latest.posts).toEqual([]);
    expect(calls).toHaveLength(10);
  });

  it('builds the same stubs as the project index', async () => {
    const newer = post('newer', general, 500, {reporterLogin: 'editor', content: 'Body', commentCount: 2});
    const older = post('older', general, 400, {reporterLogin: 'writer'});
    const {host} = createArticlesFake([general, older, newer]);
    const project = nextProject();

    const latest = await new YtArticlesRepository(host).getLatestPosts(project, 10);
    const index = await loadProjectIndex(host, project);

    expect(latest.stubs).toEqual(index.stubs);
    expect(latest.stubs[0]).toMatchObject({id: 'newer', authorLogin: 'editor', created: 500, commentsCount: 2});
    expect(latest.posts[0].author.login).toBe('editor');
  });
});

describe('YtArticlesRepository comment authors', () => {
  it('maps a comment author through the shared mapping and falls back to the login', async () => {
    const article = {
      ...toApiArticle(post('1', blog('b1', 'General', 1), 10)),
      comments: [{id: 'c1', text: 'Hello', created: 11, author: {login: 'zed', fullName: '', avatarUrl: '', ringId: ''}, reactions: []}],
    };
    const {host} = createFakeHost(() => article);
    const {comments} = await new YtArticlesRepository(host).getPostWithComments('1');
    expect(comments[0].author).toEqual({login: 'zed', fullName: 'zed', avatarUrl: '', ringId: ''});
  });
});
