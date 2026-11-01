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

function renderSection() {
  return render(
    <CommentSection
      comments={comments}
      replyMap={{}}
      loading={false}
      postAuthorLogin="ann"
      currentUser={null}
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
