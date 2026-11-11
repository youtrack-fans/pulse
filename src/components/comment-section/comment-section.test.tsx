import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import type {ArticleComment} from '../../data/types';
import {CommentSection} from './comment-section';

const author = {login: 'ann', fullName: 'Ann', avatarUrl: '', ringId: ''};
const comment = (id: string, text: string, created: number): ArticleComment => ({
  id,
  text,
  created,
  author,
  parentCommentId: null,
  reactions: [],
});

const comments = [
  comment('c1', 'Oldest comment', 1000),
  comment('c2', 'Middle comment', 2000),
  comment('c3', 'Newest comment', 3000),
];

function renderSection(list: readonly ArticleComment[] = comments, canComment = true) {
  return render(
    <CommentSection
      comments={list}
      replyMap={{}}
      loading={false}
      postAuthorLogin="ann"
      contextPath=""
      currentUser={null}
      canComment={canComment}
      onAddComment={vi.fn()}
      onAddReply={vi.fn()}
      onToggleReaction={vi.fn()}
    />,
  );
}

function shownTexts(): string[] {
  return screen.getAllByText(/comment$/).filter(element => element.tagName !== 'H2').map(element => element.textContent ?? '');
}

describe('CommentSection sort', () => {
  it('offers the three orders in a labelled select', () => {
    renderSection();
    const select = screen.getByRole('combobox', {name: 'Sort comments'});
    expect(Array.from(select.querySelectorAll('option')).map(option => option.textContent)).toEqual(['Top first', 'Newest first', 'Oldest first']);
  });

  it('shows the newest comment first after choosing newest first', () => {
    renderSection();
    fireEvent.change(screen.getByRole('combobox', {name: 'Sort comments'}), {target: {value: 'newest'}});
    expect(shownTexts()).toEqual(['Newest comment', 'Middle comment', 'Oldest comment']);
  });

  it('shows the oldest comment first after choosing oldest first', () => {
    renderSection();
    fireEvent.change(screen.getByRole('combobox', {name: 'Sort comments'}), {target: {value: 'oldest'}});
    expect(shownTexts()).toEqual(['Oldest comment', 'Middle comment', 'Newest comment']);
  });
});

describe('CommentSection content', () => {
  it('renders Markdown in a comment', () => {
    renderSection([comment('c1', 'A **bold** move', 1000)]);

    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('uses the singular in the heading for one comment', () => {
    renderSection([comment('c1', 'Only one', 1000)]);

    expect(screen.getByRole('heading', {name: '1 comment'})).toBeTruthy();
  });

  it('uses the plural in the heading for several comments', () => {
    renderSection();

    expect(screen.getByRole('heading', {name: '3 comments'})).toBeTruthy();
  });
});

describe('CommentSection without the comment permission', () => {
  it('hides the comment box and the reply buttons', () => {
    renderSection(comments, false);
    expect(screen.queryByLabelText('Add a comment')).toBeNull();
    expect(screen.queryByRole('button', {name: 'Reply'})).toBeNull();
    expect(screen.getAllByRole('button', {name: 'Like'})).toHaveLength(3);
  });

  it('does not invite to comment when there are no comments', () => {
    renderSection([], false);
    expect(screen.getByText('No comments yet.')).toBeTruthy();
  });

  it('still offers the comment box and replies to a user who can comment', () => {
    renderSection(comments, true);
    expect(screen.getByLabelText('Add a comment')).toBeTruthy();
    expect(screen.getAllByRole('button', {name: 'Reply'})).toHaveLength(3);
  });
});
