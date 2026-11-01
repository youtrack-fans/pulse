import React from 'react';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {act} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {appLocationBus} from './api/app-location-bus';
import type {HostAPI} from './api/host';
import {HostProvider} from './api/host-context';
import App from './app';
import {clearPostCache} from './data/articles/post-cache';
import {loadPostPage} from './pages/post/lazy-post-page';
import {routeToLocation} from './routing/routing';
import {createBlogHost, createConfig} from './test/blog-host';
import {blog, post} from './test/fake-host';

const general = blog('b1', 'General', 1);
const article = post('p1', general, 10, {
  summary: 'Readable article',
  content: 'Body of the readable article',
  reporterLogin: 'ann',
  commentTexts: ['First comment'],
});

const otherArticle = post('p2', general, 20, {summary: 'Other article', reporterLogin: 'bob'});

function renderApp(initialLocation: ReturnType<typeof routeToLocation> | null) {
  const host = createBlogHost({blogs: [general], posts: [article, otherArticle]}).host;
  return render(
    <HostProvider value={host}>
      <App config={createConfig()} initialLocation={initialLocation}/>
    </HostProvider>,
  );
}

describe('App', () => {
  beforeEach(clearPostCache);

  it('opens the readable article from the magazine card without a loading placeholder', async () => {
    await loadPostPage();
    renderApp(null);
    fireEvent.click(await screen.findByRole('button', {name: 'Readable article'}));
    expect(screen.getByRole('heading', {level: 1, name: 'Readable article'})).toBeTruthy();
    expect(await screen.findByText('First comment')).toBeTruthy();
  });

  it('opens the readable article from a feed card without a loading placeholder', async () => {
    await loadPostPage();
    renderApp(routeToLocation({name: 'feed', blogId: 'b1'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Readable article'}));
    expect(screen.getByRole('heading', {level: 1, name: 'Readable article'})).toBeTruthy();
  });

  it('shows the article for a direct link after loading it', async () => {
    renderApp(routeToLocation({name: 'post', postId: 'p1'}));
    expect(screen.queryByRole('heading', {level: 1, name: 'Readable article'})).toBeNull();
    expect(await screen.findByRole('heading', {level: 1, name: 'Readable article'})).toBeTruthy();
    expect(await screen.findByText('First comment')).toBeTruthy();
  });

  it('has a single level one heading on the article page', async () => {
    renderApp(routeToLocation({name: 'post', postId: 'p1'}));
    await screen.findByRole('heading', {level: 1, name: 'Readable article'});
    expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);
  });

  it('returns to the magazine from the brand button', async () => {
    renderApp(routeToLocation({name: 'post', postId: 'p1'}));
    await screen.findByRole('heading', {level: 1, name: 'Readable article'});
    fireEvent.click(screen.getByRole('button', {name: 'Pulse'}));
    expect(await screen.findAllByRole('button', {name: 'Readable article'})).not.toHaveLength(0);
  });

  it('shows a retry in the header when the categories cannot be loaded and fills it after the retry', async () => {
    const fixture = {blogs: [general], posts: [article], failArticles: true};
    const host = createBlogHost(fixture).host;
    render(
      <HostProvider value={host}>
        <App config={createConfig()} initialLocation={null}/>
      </HostProvider>,
    );
    const retry = await screen.findByRole('button', {name: /Categories could not be loaded/});
    fixture.failArticles = false;
    fireEvent.click(retry);
    expect(await screen.findByRole('button', {name: 'General'})).toBeTruthy();
    expect(screen.queryByRole('button', {name: /Categories could not be loaded/})).toBeNull();
  });

  it('hides the list while an article is open and shows it again when the location returns to the list', async () => {
    await loadPostPage();
    renderApp(null);
    fireEvent.click(await screen.findByRole('button', {name: 'Readable article'}));
    expect(screen.queryByRole('button', {name: 'Readable article'})).toBeNull();
    act(() => appLocationBus.emit(routeToLocation({name: 'blog-list'})));
    expect(await screen.findByRole('button', {name: 'Readable article'})).toBeTruthy();
    expect(screen.queryByRole('heading', {level: 1, name: 'Readable article'})).toBeNull();
  });

  it('warns when the address of the page cannot be updated', async () => {
    await loadPostPage();
    const base = createBlogHost({blogs: [general], posts: [article]}).host;
    const host: HostAPI = {
      ...base,
      navigation: {
        getAppLocation: async () => routeToLocation({name: 'blog-list'}),
        updateAppLocation: () => Promise.reject(new Error('address failed')),
        replaceAppLocation: () => Promise.reject(new Error('address failed')),
      },
    };
    render(
      <HostProvider value={host}>
        <App config={createConfig()} initialLocation={null}/>
      </HostProvider>,
    );
    fireEvent.click(await screen.findByRole('button', {name: 'Readable article'}));
    expect(await screen.findByText('The address of the page could not be updated.')).toBeTruthy();
  });

  it('filters the magazine by the author of a clicked card and lifts the filter when the location returns', async () => {
    renderApp(null);
    fireEvent.click((await screen.findAllByRole('button', {name: 'ann'}))[0]);
    expect(await screen.findByText(/Posts by ann/)).toBeTruthy();
    expect(screen.queryByRole('button', {name: 'Other article'})).toBeNull();
    act(() => appLocationBus.emit(routeToLocation({name: 'blog-list'})));
    expect(await screen.findByRole('button', {name: 'Other article'})).toBeTruthy();
    expect(screen.queryByText(/Posts by ann/)).toBeNull();
  });

  it('opens the article at its comments from the comments button of a magazine card', async () => {
    await loadPostPage();
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    renderApp(null);
    const card = (await screen.findByRole('heading', {level: 2, name: 'Readable article'})).closest('article');
    fireEvent.click(within(card as HTMLElement).getByRole('button', {name: '1 comment'}));
    expect(await screen.findByRole('heading', {level: 1, name: 'Readable article'})).toBeTruthy();
    await vi.waitFor(() => expect(scroll).toHaveBeenCalled());
    expect((scroll.mock.contexts[0] as HTMLElement).textContent).toContain('First comment');
    scroll.mockRestore();
  });
});
