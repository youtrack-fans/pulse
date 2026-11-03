import {describe, expect, it} from 'vitest';

import smoothImageStyles from '../smooth-image/smooth-image.module.css';
import styles from './post-content.module.css';
import {renderPostContent} from './render-post-content';

function images(html: string): HTMLImageElement[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  return [...container.querySelectorAll('img')];
}

describe('renderPostContent images', () => {
  it('wraps a Markdown image in the loading frame with its size and loading attributes', () => {
    const [image] = images(renderPostContent('Text\n\n![Alt](/api/files/1?sign=a#pulse-size=1600x900)', '').html);

    expect(image.parentElement?.className).toBe(`${smoothImageStyles.frame} ${styles.figure}`);
    expect(image.className).toBe(smoothImageStyles.image);
    expect(image.getAttribute('width')).toBe('1600');
    expect(image.getAttribute('height')).toBe('900');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('decoding')).toBe('async');
  });

  it('gives a raw HTML image the same frame', () => {
    const [image] = images(renderPostContent('Text\n\n<img src="/api/files/2?sign=a" alt="">', '').html);

    expect(image.parentElement?.className).toBe(`${smoothImageStyles.frame} ${styles.figure}`);
    expect(image.className).toBe(smoothImageStyles.image);
  });

  it('wraps every image of a paragraph once', () => {
    const found = images(renderPostContent('![A](/api/files/3) and ![B](/api/files/4)', '').html);

    expect(found).toHaveLength(2);
    found.forEach(image => {
      expect(image.parentElement?.className).toContain(smoothImageStyles.frame);
      expect(image.parentElement?.parentElement?.className ?? '').not.toContain(smoothImageStyles.frame);
    });
  });
});

function links(html: string): HTMLAnchorElement[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  return [...container.querySelectorAll('a')];
}

describe('renderPostContent links', () => {
  it('puts root-relative links under the YouTrack context path and leaves the others alone', () => {
    const markdown = '[a](/issue/ABC-1) [b](/youtrack/articles/X-A-1) [c](https://example.com/x) [d](//cdn.example.com/y) [e](#top)';
    const hrefs = links(renderPostContent(markdown, '/youtrack').html).map(link => link.getAttribute('href'));

    expect(hrefs).toEqual(['/youtrack/issue/ABC-1', '/youtrack/articles/X-A-1', 'https://example.com/x', '//cdn.example.com/y', '#top']);
  });

  it('keeps root-relative links as they are on an instance served at the root', () => {
    const [link] = links(renderPostContent('[a](/issue/ABC-1)', '').html);

    expect(link.getAttribute('href')).toBe('/issue/ABC-1');
  });
});
