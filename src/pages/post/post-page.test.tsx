import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {clearPostCache, rememberPosts} from '../../data/articles/post-cache';
import type {BlogPost} from '../../data/types';
import {createBlogHost, createConfig} from '../../test/blog-host';
import {blog, post} from '../../test/fake-host';
import {renderWithApp} from '../../test/render-with-app';
import {PostPage} from './post-page';

const general = blog('b1', 'General', 1);
const article = post('p1', general, 10, {
  summary: 'Readable article',
  content: 'Body of the readable article',
  reporterLogin: 'ann',
  commentTexts: ['First comment', 'Second comment'],
});

const cachedPost: BlogPost = {
  id: 'p1',
  idReadable: 'P-A-p1',
  summary: 'Readable article',
  content: 'Body of the readable article',
  created: 10,
  updated: 10,
  author: {login: 'ann', fullName: 'ann', avatarUrl: '', ringId: ''},
  parentArticle: {id: 'b1', idReadable: 'b1', summary: 'General'},
  tags: [],
  commentsCount: 2,
  hasStar: false,
  topComment: null,
  topCommentReplies: 0,
};

describe('PostPage', () => {
  beforeEach(clearPostCache);

  it('shows the article at once when the feed already loaded it', () => {
    rememberPosts([cachedPost]);
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    expect(screen.getByRole('heading', {name: 'Readable article'})).toBeTruthy();
    expect(screen.getByText('Body of the readable article')).toBeTruthy();
  });

  it('loads the comments in the background after showing a cached article', async () => {
    rememberPosts([cachedPost]);
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    expect(screen.queryByText('First comment')).toBeNull();
    expect(await screen.findByText('First comment')).toBeTruthy();
    expect(screen.getByText('Second comment')).toBeTruthy();
  });

  it('shows the placeholder first and then the article when it was not loaded before', async () => {
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    expect(screen.queryByRole('heading', {name: 'Readable article'})).toBeNull();
    expect(await screen.findByRole('heading', {name: 'Readable article'})).toBeTruthy();
    expect(await screen.findByText('First comment')).toBeTruthy();
  });

  it('shows an error with a retry when the article cannot be loaded', async () => {
    const host = createBlogHost({blogs: [general], posts: [article], failArticles: true}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    expect(await screen.findByText('This post could not be loaded.')).toBeTruthy();
    expect(screen.getByRole('button', {name: 'Retry'})).toBeTruthy();
  });

  it('says the post was not found, without a retry, when it does not exist', async () => {
    const host = createBlogHost({blogs: [general], posts: []}).host;
    renderWithApp(<PostPage postId="missing" config={createConfig()}/>, host);
    expect(await screen.findByText('Post not found')).toBeTruthy();
    expect(screen.queryByRole('button', {name: 'Retry'})).toBeNull();
    expect(screen.getByRole('button', {name: 'Back to the blog'})).toBeTruthy();
  });

  it('toggles the bookmark of the article', async () => {
    rememberPosts([cachedPost]);
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    await screen.findByText('First comment');
    fireEvent.click(screen.getByRole('button', {name: 'Bookmark'}));
    expect(screen.getByRole('button', {name: 'Bookmark'}).getAttribute('aria-pressed')).toBe('true');
  });

  it('labels the comment count of the article for screen readers', async () => {
    rememberPosts([cachedPost]);
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    await screen.findByText('First comment');
    expect(screen.getByRole('img', {name: '2 comments'})).toBeTruthy();
  });

  it('scrolls to the comments once they are loaded when the article is opened at its comments', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    rememberPosts([cachedPost]);
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()} scrollToComments/>, host);
    await screen.findByText('First comment');
    await vi.waitFor(() => expect(scroll).toHaveBeenCalledTimes(1));
    const target = scroll.mock.contexts[0] as HTMLElement;
    expect(target.textContent).toContain('First comment');
    expect(scroll).toHaveBeenCalledWith({block: 'start'});
    scroll.mockRestore();
  });

  it('scrolls to the comments when the article is opened at its comments without being cached', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()} scrollToComments/>, host);
    await screen.findByText('First comment');
    await vi.waitFor(() => expect(scroll).toHaveBeenCalledTimes(1));
    expect(scroll).toHaveBeenCalledWith({block: 'start'});
    scroll.mockRestore();
  });

  it('keeps the cached article and reports only the comments when the refresh fails', async () => {
    rememberPosts([cachedPost]);
    const host = createBlogHost({blogs: [general], posts: [article], failArticles: true}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    expect(await screen.findByText('The comments could not be loaded.')).toBeTruthy();
    expect(screen.getByRole('heading', {name: 'Readable article'})).toBeTruthy();
    expect(screen.queryByText('This post could not be loaded.')).toBeNull();
    expect(screen.getByRole('button', {name: 'Retry'})).toBeTruthy();
  });

  it('does not scroll when the article is opened at the top', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    rememberPosts([cachedPost]);
    const host = createBlogHost({blogs: [general], posts: [article]}).host;
    renderWithApp(<PostPage postId="p1" config={createConfig()}/>, host);
    await screen.findByText('First comment');
    expect(scroll).not.toHaveBeenCalled();
    scroll.mockRestore();
  });

  it('shows no number in the comment count of an article without comments', async () => {
    const quiet = post('p9', general, 10, {summary: 'Quiet article', content: 'Nothing yet'});
    const host = createBlogHost({blogs: [general], posts: [quiet]}).host;
    renderWithApp(<PostPage postId="p9" config={createConfig()}/>, host);
    expect((await screen.findByRole('img', {name: '0 comments'})).textContent).toBe('');
  });
});
