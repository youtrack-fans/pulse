import React from 'react';
import {fireEvent, screen, within} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {HostAPI} from '../../api/host';
import {clearPostCache} from '../../data/articles/post-cache';
import {createBlogHost, createConfig} from '../../test/blog-host';
import {blog, post} from '../../test/fake-host';
import {activeWatcherCount, installFakeIntersectionObserver, scrollToEnd} from '../../test/fake-intersection';
import {renderWithApp} from '../../test/render-with-app';
import {FeedPage} from './feed-page';

const general = blog('b1', 'General', 1);
const posts = [
  post('p1', general, 10, {summary: 'Oldest article'}),
  post('p2', general, 20, {summary: 'Middle article'}),
  post('p3', general, 30, {summary: 'Newest article'}),
];

describe('FeedPage', () => {
  it('shows the posts of the blog as cards, newest first', async () => {
    const host = createBlogHost({blogs: [general], posts}).host;
    renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    const titles = await screen.findAllByRole('heading', {level: 2});
    expect(titles.map(title => title.textContent)).toEqual(['Newest article', 'Middle article', 'Oldest article']);
  });

  it('opens the post when its card is clicked', async () => {
    const host = createBlogHost({blogs: [general], posts}).host;
    const {navigation} = renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    fireEvent.click(await screen.findByRole('button', {name: 'Middle article'}));
    expect(navigation.goToPost).toHaveBeenCalledWith('p2', undefined, 'Middle article');
  });

  it('opens the comments of the post when the comments button of a card is clicked', async () => {
    const host = createBlogHost({blogs: [general], posts}).host;
    const {navigation} = renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    await screen.findByRole('heading', {name: 'Middle article'});
    const middle = screen.getByRole('heading', {name: 'Middle article'}).closest('article');
    fireEvent.click(within(middle as HTMLElement).getByRole('button', {name: '0 comments'}));
    expect(navigation.goToComments).toHaveBeenCalledWith('p2', 'Middle article');
    expect(navigation.goToPost).not.toHaveBeenCalled();
  });

  it('shows the empty state for a blog without posts', async () => {
    const host = createBlogHost({blogs: [general], posts: []}).host;
    renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    expect(await screen.findByText('No posts yet. Create the first one!')).toBeTruthy();
  });

  it('shows an error with a retry when the blog cannot be loaded', async () => {
    const host = createBlogHost({blogs: [general], posts, failArticles: true}).host;
    renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    expect(await screen.findByText('This blog could not be loaded.')).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Retry'})).toBeTruthy();
  });

  it('toggles the bookmark of a card', async () => {
    const host = createBlogHost({blogs: [general], posts}).host;
    renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    await screen.findByRole('heading', {name: 'Newest article'});
    const [first] = screen.getAllByRole('button', {name: 'Bookmark'});
    fireEvent.click(first);
    expect(first.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('FeedPage loading more', () => {
  const many = Array.from({length: 12}, (_unused, index) => post(`m${index + 1}`, general, 100 + index, {summary: `Article ${index + 1}`}));
  const headings = () => screen.getAllByRole('heading', {level: 2}).length;

  beforeEach(installFakeIntersectionObserver);

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the first posts and loads the rest when the end comes into view', async () => {
    const host = createBlogHost({blogs: [general], posts: many}).host;
    renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    await screen.findByRole('heading', {name: 'Article 12'});
    expect(headings()).toBe(5);
    scrollToEnd();
    await vi.waitFor(() => expect(headings()).toBe(12));
  });

  it('stops watching the end once every post is loaded', async () => {
    const host = createBlogHost({blogs: [general], posts: many}).host;
    renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, host);
    await screen.findByRole('heading', {name: 'Article 12'});
    expect(activeWatcherCount()).toBeGreaterThan(0);
    scrollToEnd();
    await vi.waitFor(() => expect(headings()).toBe(12));
    await vi.waitFor(() => expect(activeWatcherCount()).toBe(0));
  });

  it('offers a retry when the next posts cannot be loaded and loads them after it', async () => {
    const fixture = {blogs: [general], posts: many, failChildren: false};
    renderWithApp(<FeedPage blogId="b1" config={createConfig()}/>, createBlogHost(fixture).host);
    await screen.findByRole('heading', {name: 'Article 12'});
    fixture.failChildren = true;
    scrollToEnd();
    const retry = await screen.findByRole('button', {name: 'Retry loading more posts'});
    expect(headings()).toBe(5);
    expect(activeWatcherCount()).toBe(0);
    fixture.failChildren = false;
    fireEvent.click(retry);
    await vi.waitFor(() => expect(headings()).toBe(12));
    expect(screen.queryByRole('button', {name: 'Retry loading more posts'})).toBeNull();
  });
});

describe('FeedPage from the caches', () => {
  const cached = Array.from({length: 12}, (_unused, index) => post(`r${index + 1}`, general, 100 + index, {
    summary: `Cached article ${index + 1}`,
    commentTexts: index % 2 === 0 ? ['a comment'] : undefined,
  }));
  const headings = () => screen.getAllByRole('heading', {level: 2}).length;

  beforeEach(() => {
    clearPostCache();
    installFakeIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the posts and the Popular widget on the very first render of a second visit', async () => {
    const host = createBlogHost({blogs: [general], posts: cached}).host;
    const config = createConfig();
    const first = renderWithApp(<FeedPage blogId="b1" config={config}/>, host);
    await screen.findByRole('heading', {name: 'Cached article 12'});
    await screen.findByText('Popular');
    first.unmount();

    renderWithApp(<FeedPage blogId="b1" config={config}/>, host);
    expect(screen.getByRole('heading', {name: 'Cached article 12'})).toBeTruthy();
    expect(headings()).toBe(5);
    expect(screen.getByText('Popular')).toBeTruthy();
  });

  it('keeps the pages loaded while the background refresh of the first page is still running', async () => {
    const inner = createBlogHost({blogs: [general], posts: cached}).host;
    const pending: Array<() => void> = [];
    let hold = false;
    const host = {
      ...inner,
      fetchYouTrack: async (path: string, params?: unknown) => {
        if (hold && /childArticles/.test(path)) {
          await new Promise<void>(resolve => pending.push(resolve));
        }
        return inner.fetchYouTrack(path, params as never);
      },
    } as HostAPI;
    const config = createConfig();
    const first = renderWithApp(<FeedPage blogId="b1" config={config}/>, host);
    await screen.findByRole('heading', {name: 'Cached article 12'});
    first.unmount();

    hold = true;
    renderWithApp(<FeedPage blogId="b1" config={config}/>, host);
    expect(headings()).toBe(5);
    scrollToEnd();
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[0]();
    await vi.waitFor(() => expect(headings()).toBe(12));
    pending[1]();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(headings()).toBe(12);
    expect(screen.getByRole('heading', {name: 'Cached article 1'})).toBeTruthy();
  });

  it('keeps showing the cached posts when the background refresh fails', async () => {
    const fixture = {blogs: [general], posts: cached, failChildren: false};
    const host = createBlogHost(fixture).host;
    const config = createConfig();
    const first = renderWithApp(<FeedPage blogId="b1" config={config}/>, host);
    await screen.findByRole('heading', {name: 'Cached article 12'});
    first.unmount();

    fixture.failChildren = true;
    renderWithApp(<FeedPage blogId="b1" config={config}/>, host);
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(screen.queryByText('This blog could not be loaded.')).toBeNull();
    expect(headings()).toBe(5);
  });
});
