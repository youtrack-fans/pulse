import {describe, expect, it} from 'vitest';

import smoothImageStyles from '../smooth-image/smooth-image.module.css';
import styles from './post-content.module.css';
import mentionStyles from '../mention-text/mention-text.module.css';
import {renderCommentContent, renderPostContent} from './render-post-content';

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

function commentRoot(text: string, contextPath = ''): HTMLDivElement {
  const container = document.createElement('div');
  container.innerHTML = renderCommentContent(text, contextPath);
  return container;
}

describe('renderCommentContent', () => {
  it('renders Markdown formatting', () => {
    const root = commentRoot('A **bold** word, `code` and [a link](https://example.com)');

    expect(root.querySelector('strong')?.textContent).toBe('bold');
    expect(root.querySelector('code')?.textContent).toBe('code');
    expect(root.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
    expect(root.querySelector('a')?.getAttribute('target')).toBe('_blank');
  });

  it('keeps a leading heading instead of dropping it as a post title', () => {
    expect(commentRoot('# Heading\n\nBody').querySelector('h1')?.textContent).toBe('Heading');
  });

  it('highlights a mention in plain text', () => {
    const mention = commentRoot('Thanks @Ann Smith for this').querySelector(`.${mentionStyles.mention}`);

    expect(mention?.textContent).toBe('@Ann Smith');
  });

  it('leaves a mention inside code untouched', () => {
    expect(commentRoot('Run `@Ann` now').querySelector(`.${mentionStyles.mention}`)).toBeNull();
  });

  it('removes scripts and event handlers', () => {
    const root = commentRoot('<img src="x" onerror="alert(1)"><script>alert(2)</script>text');

    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('img')?.hasAttribute('onerror')).toBe(false);
    expect(root.textContent).toContain('text');
  });

  it('puts a root-relative link under the context path', () => {
    expect(commentRoot('[a](/issue/ABC-1)', '/youtrack').querySelector('a')?.getAttribute('href')).toBe('/youtrack/issue/ABC-1');
  });
});
