import {describe, expect, it} from 'vitest';

import {getSnippet, stripMarkdown} from './utils';

describe('stripMarkdown', () => {
  it('removes fenced code blocks entirely', () => {
    expect(stripMarkdown('before\n```ts\nconst a = `x`;\n```\nafter')).toBe('before\nafter');
  });

  it('keeps the text of inline code', () => {
    expect(stripMarkdown('use `npm test` here')).toBe('use npm test here');
  });

  it('strips emphasis and links', () => {
    expect(stripMarkdown('**bold** and [link](https://example.com)')).toBe('bold and link');
  });

  it('keeps underscores inside identifiers and links', () => {
    expect(stripMarkdown('call snake_case_name and see https://example.com/a_b_c')).toBe('call snake_case_name and see https://example.com/a_b_c');
  });

  it('strips underscore and asterisk emphasis around whole words', () => {
    expect(stripMarkdown('an _emphasised_ and *starred* and __strong__ word')).toBe('an emphasised and starred and strong word');
  });

  it('keeps asterisks used as multiplication', () => {
    expect(stripMarkdown('2*3*4 equals 24')).toBe('2*3*4 equals 24');
  });

  it('leaves a table out of the text', () => {
    const text = 'All repositories were scanned.\n\n| Measure | Value |\n|---|---:|\n| Unique | 7,139 |\n\nThe next paragraph stays.';
    expect(stripMarkdown(text)).toBe('All repositories were scanned.\nThe next paragraph stays.');
  });

  it('drops only the separator row of a table that has no outer pipes', () => {
    expect(stripMarkdown('Before\n\nA | B\n--- | ---\n1 | 2\n\nAfter')).toBe('Before\nA | B\n1 | 2\nAfter');
  });

  it('keeps a sentence that only contains a pipe', () => {
    expect(stripMarkdown('Use a | b to separate options.')).toBe('Use a | b to separate options.');
  });
});

describe('getSnippet', () => {
  it('leaves out headings, so the title and section names do not run into the text', () => {
    expect(getSnippet('# Title\n\nIntro text.\n\n## Section\n\nMore text.')).toBe('Intro text.\nMore text.');
  });

  it('falls back to the headings when the content has nothing else', () => {
    expect(getSnippet('# Only a title')).toBe('Only a title');
  });

  it('does not stack the ellipsis on a full stop', () => {
    const text = `${'word '.repeat(10).trim()}. ${'next '.repeat(10).trim()}`;
    expect(getSnippet(text, 52)).toBe(`${'word '.repeat(10).trim()}...`);
  });

  it('returns short text unchanged', () => {
    expect(getSnippet('Short.')).toBe('Short.');
  });
});
