import React from 'react';
import {fireEvent, render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {SmoothImage} from './smooth-image';

function renderImage(src: string, priority = false): HTMLImageElement {
  const {container} = render(<SmoothImage src={src} priority={priority}/>);
  return container.querySelector('img') as HTMLImageElement;
}

describe('SmoothImage', () => {
  it('reserves the box from the declared size and loads lazily by default', () => {
    const image = renderImage('/api/files/1-1?sign=a#pulse-size=1600x534');

    expect(image.getAttribute('width')).toBe('1600');
    expect(image.getAttribute('height')).toBe('534');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('fetchpriority')).toBeNull();
    expect(image.dataset.loaded).toBeUndefined();
  });

  it('loads a priority image eagerly with a high fetch priority', () => {
    const image = renderImage('/api/files/1-2?sign=a', true);

    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.getAttribute('fetchpriority')).toBe('high');
  });

  it('shows a source that loaded before at once', () => {
    const first = renderImage('/api/files/1-3?sign=a&updated=7');
    fireEvent.load(first);
    expect(first.dataset.loaded).toBe('instant');

    const second = renderImage('/api/files/1-3?sign=a&updated=7');

    expect(second.dataset.loaded).toBe('instant');
    expect(second.getAttribute('loading')).toBe('eager');
  });
});
