import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import type {BlogPost} from '../../data/types';
import {PostCard} from './post-card';

const post: BlogPost = {
  id: 'p1',
  idReadable: 'P-A-p1',
  summary: 'Readable article',
  content: 'Body of the article',
  created: 1000,
  updated: 1000,
  author: {login: 'ann', fullName: 'Ann Lee', avatarUrl: '', ringId: ''},
  parentArticle: {id: 'b1', idReadable: 'b1', summary: 'General'},
  tags: [],
  commentsCount: 2,
  hasStar: false,
  topComment: null,
  topCommentReplies: 0,
};

function renderCard() {
  const handlers = {
    onClick: vi.fn(),
    onCommentsClick: vi.fn(),
    onAuthorClick: vi.fn(),
    onToggleStar: vi.fn(),
    onToggleReaction: vi.fn().mockResolvedValue(undefined),
  };
  render(<PostCard post={post} reactions={[]} {...handlers}/>);
  return handlers;
}

describe('PostCard', () => {
  it('is an article with a heading and no button role around its controls', () => {
    renderCard();
    const article = screen.getByRole('article');
    expect(article.getAttribute('role')).toBeNull();
    expect(article.getAttribute('tabindex')).toBeNull();
    expect(screen.getByRole('heading', {level: 2, name: 'Readable article'})).toBeTruthy();
  });

  it('opens the post from the title button', () => {
    const handlers = renderCard();
    fireEvent.click(screen.getByRole('button', {name: 'Readable article'}));
    expect(handlers.onClick).toHaveBeenCalledTimes(1);
  });

  it('does not open the post when the author, like or bookmark is used', () => {
    const handlers = renderCard();
    fireEvent.click(screen.getByRole('button', {name: 'Ann Lee'}));
    fireEvent.click(screen.getByRole('button', {name: 'Like'}));
    fireEvent.click(screen.getByRole('button', {name: 'Bookmark'}));
    expect(handlers.onAuthorClick).toHaveBeenCalledWith('ann');
    expect(handlers.onToggleReaction).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleStar).toHaveBeenCalledWith('p1', true);
    expect(handlers.onClick).not.toHaveBeenCalled();
  });

  it('shows the comments as a labelled button with only the number, before the like and the bookmark', () => {
    const handlers = renderCard();
    const comments = screen.getByRole('button', {name: '2 comments'});
    expect(comments.textContent).toBe('2');
    fireEvent.click(comments);
    expect(handlers.onCommentsClick).toHaveBeenCalledTimes(1);
    expect(handlers.onClick).not.toHaveBeenCalled();
    const names = screen.getAllByRole('button').map(button => button.getAttribute('aria-label') ?? button.textContent);
    expect(names.indexOf('2 comments')).toBeLessThan(names.indexOf('Like'));
    expect(names.indexOf('Like')).toBeLessThan(names.indexOf('Bookmark'));
  });

  it('has no comment input under the post', () => {
    renderCard();
    expect(screen.queryByPlaceholderText(/Add a comment/)).toBeNull();
  });

  it('marks a saved post with a pressed bookmark', () => {
    render(<PostCard post={{...post, hasStar: true}} reactions={[]} onClick={vi.fn()} onCommentsClick={vi.fn()}/>);
    expect(screen.getByRole('button', {name: 'Bookmark'}).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows no number in the comments button when there are no comments', () => {
    render(<PostCard post={{...post, commentsCount: 0}} reactions={[]} onClick={vi.fn()} onCommentsClick={vi.fn()}/>);
    const comments = screen.getByRole('button', {name: '0 comments'});
    expect(comments.textContent).toBe('');
  });

  it('shows no table markup in the excerpt', () => {
    const content = 'Internal research. All repositories were scanned.\n\n| Measure | Value |\n|---|---:|\n| Unique | 7,139 |';
    render(<PostCard post={{...post, content}} reactions={[]} onClick={vi.fn()} onCommentsClick={vi.fn()}/>);
    expect(screen.getByText('Internal research. All repositories were scanned.')).toBeTruthy();
    expect(screen.queryByText(/\|/)).toBeNull();
  });
});
