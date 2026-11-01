import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Avatar} from './avatar';

function getImage(container: HTMLElement): HTMLImageElement {
  const image = container.querySelector<HTMLImageElement>('img');
  if (!image) {
    throw new Error('The avatar has no image');
  }
  return image;
}

describe('Avatar', () => {
  it('shows the picture when there is an address', () => {
    const {container} = render(<Avatar name="Ann Lee" avatarUrl="https://example.com/ann.png"/>);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/ann.png');
    expect(screen.queryByText('AL')).toBeNull();
  });

  it('shows the initials without an address', () => {
    render(<Avatar name="Ann Lee"/>);
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('falls back to the initials when the picture cannot be loaded', () => {
    const {container} = render(<Avatar name="Ann Lee" avatarUrl="https://example.com/broken.png"/>);
    fireEvent.error(getImage(container));
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('tries the new picture when the address changes after a failure', () => {
    const {container, rerender} = render(<Avatar name="Ann Lee" avatarUrl="https://example.com/broken.png"/>);
    fireEvent.error(getImage(container));
    rerender(<Avatar name="Ann Lee" avatarUrl="https://example.com/fixed.png"/>);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/fixed.png');
  });
});
