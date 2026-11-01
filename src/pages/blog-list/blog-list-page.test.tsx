import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {createBlogHost, createConfig} from '../../test/blog-host';
import {blog, post} from '../../test/fake-host';
import {installFakeIntersectionObserver, scrollToEnd} from '../../test/fake-intersection';
import {renderWithApp} from '../../test/render-with-app';
import {BlogListPage} from './blog-list-page';

const general = blog('b1', 'General', 1);
const news = blog('b2', 'News', 2);
const posts = [
  post('p1', general, 10, {summary: 'General article', reporterLogin: 'ann'}),
  post('p2', news, 20, {summary: 'News article', reporterLogin: 'bob'}),
  post('p3', general, 30, {summary: 'Second general article', reporterLogin: 'bob'}),
];

describe('BlogListPage', () => {
  it('shows the posts of every blog, newest first', async () => {
    const host = createBlogHost({blogs: [general, news], posts}).host;
    renderWithApp(<BlogListPage config={createConfig()}/>, host);
    const titles = await screen.findAllByRole('heading', {level: 2});
    expect(titles.map(title => title.textContent)).toEqual(['Second general article', 'News article', 'General article']);
  });

  it('shows only the posts of the chosen blog', async () => {
    const host = createBlogHost({blogs: [general, news], posts}).host;
    renderWithApp(<BlogListPage config={createConfig()} rubricId="b1"/>, host);
    expect(await screen.findByRole('heading', {name: 'General article'})).toBeTruthy();
    expect(screen.queryByRole('heading', {name: 'News article'})).toBeNull();
  });

  it('tells how to start a blog when the project has no blogs', async () => {
    const host = createBlogHost({blogs: [], posts: []}).host;
    renderWithApp(<BlogListPage config={createConfig()}/>, host);
    expect(await screen.findByText('No Blogs Found')).toBeTruthy();
  });

  it('shows an error with a retry when the blogs cannot be loaded', async () => {
    const host = createBlogHost({blogs: [general], posts, failArticles: true}).host;
    renderWithApp(<BlogListPage config={createConfig()}/>, host);
    expect(await screen.findByText('Blogs could not be loaded.')).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Retry'})).toBeTruthy();
  });

  it('shows only the posts of the author in the address and says whose they are', async () => {
    const host = createBlogHost({blogs: [general, news], posts}).host;
    renderWithApp(<BlogListPage config={createConfig()} authorLogin="bob"/>, host);
    expect(await screen.findByRole('heading', {name: 'News article'})).toBeTruthy();
    expect(screen.getByRole('heading', {name: 'Second general article'})).toBeTruthy();
    expect(screen.queryByRole('heading', {name: 'General article'})).toBeNull();
    expect(screen.getByText(/Posts by bob/)).toBeTruthy();
  });

  it('keeps the filter banner and its Clear button when no loaded post belongs to the author', async () => {
    const host = createBlogHost({blogs: [general, news], posts}).host;
    renderWithApp(<BlogListPage config={createConfig()} authorLogin="nobody"/>, host);
    expect(await screen.findByText('No posts match your filter.')).toBeTruthy();
    expect(screen.getByText(/Posts by nobody/)).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Clear filter'})).toBeTruthy();
  });

  it('puts the author of a clicked card into the address instead of a local filter', async () => {
    const host = createBlogHost({blogs: [general, news], posts}).host;
    const {navigation} = renderWithApp(<BlogListPage config={createConfig()}/>, host);
    await screen.findByRole('heading', {name: 'General article'});
    fireEvent.click(screen.getAllByRole('button', {name: 'ann'})[0]);
    expect(navigation.goToBlogList).toHaveBeenCalledWith(undefined, undefined, 'ann');
    expect(screen.getByRole('heading', {name: 'News article'})).toBeTruthy();
  });

  it('keeps the chosen blog when an author is clicked inside it', async () => {
    const host = createBlogHost({blogs: [general, news], posts}).host;
    const {navigation} = renderWithApp(<BlogListPage config={createConfig()} rubricId="b1"/>, host);
    await screen.findByRole('heading', {name: 'General article'});
    fireEvent.click(screen.getAllByRole('button', {name: 'bob'})[0]);
    expect(navigation.goToBlogList).toHaveBeenCalledWith('b1', 'General', 'bob');
  });

  it('clears the author through the address and keeps the chosen blog', async () => {
    const host = createBlogHost({blogs: [general, news], posts}).host;
    const {navigation} = renderWithApp(<BlogListPage config={createConfig()} rubricId="b1" authorLogin="bob"/>, host);
    fireEvent.click(await screen.findByRole('button', {name: 'Clear filter'}));
    expect(navigation.goToBlogList).toHaveBeenCalledWith('b1', 'General');
  });
});

describe('BlogListPage loading more', () => {
  const many = Array.from({length: 25}, (_unused, index) => post(`m${index + 1}`, general, 100 + index, {summary: `Article ${index + 1}`}));
  const headings = () => screen.getAllByRole('heading', {level: 2}).length;

  beforeEach(installFakeIntersectionObserver);

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows ten posts first and ten more each time the end comes into view', async () => {
    const host = createBlogHost({blogs: [general], posts: many}).host;
    renderWithApp(<BlogListPage config={createConfig()}/>, host);
    await vi.waitFor(() => expect(headings()).toBe(10));
    scrollToEnd();
    await vi.waitFor(() => expect(headings()).toBe(20));
    scrollToEnd();
    await vi.waitFor(() => expect(headings()).toBe(25));
  });

  it('starts again from ten posts when another author is chosen', async () => {
    const host = createBlogHost({blogs: [general], posts: many}).host;
    const config = createConfig();
    const {rerenderApp} = renderWithApp(<BlogListPage config={config}/>, host);
    await vi.waitFor(() => expect(headings()).toBe(10));
    scrollToEnd();
    await vi.waitFor(() => expect(headings()).toBe(20));
    rerenderApp(<BlogListPage config={config} authorLogin="author"/>);
    await vi.waitFor(() => expect(headings()).toBe(10));
  });
});

describe('BlogListPage popular widget on a second visit', () => {
  const busy = [
    post('q1', general, 10, {summary: 'Busy article', commentTexts: ['first', 'second']}),
    post('q2', general, 20, {summary: 'Quiet article'}),
  ];

  it('shows the Popular widget on the very first render when everything is cached', async () => {
    const host = createBlogHost({blogs: [general], posts: busy}).host;
    const config = createConfig();
    const first = renderWithApp(<BlogListPage config={config}/>, host);
    expect(await screen.findByText('Popular')).toBeTruthy();
    first.unmount();

    renderWithApp(<BlogListPage config={config}/>, host);
    expect(screen.getByText('Popular')).toBeTruthy();
    expect(screen.getByText('2 comments', {exact: false})).toBeTruthy();
  });
});
