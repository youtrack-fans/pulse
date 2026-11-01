import {describe, expect, it} from 'vitest';

import {replaceEmojiShortcodes} from './emoji';

describe('replaceEmojiShortcodes', () => {
  it('replaces a known shortcode', () => {
    expect(replaceEmojiShortcodes('Launch :rocket: today')).toBe('Launch 🚀 today');
  });

  it('turns a country code into a flag', () => {
    expect(replaceEmojiShortcodes('Hello from :de:')).toBe('Hello from 🇩🇪');
  });

  it('turns a flag name into a flag', () => {
    expect(replaceEmojiShortcodes(':flag-fr:')).toBe('🇫🇷');
  });

  it('leaves a two letter word that is not a country code as written', () => {
    expect(replaceEmojiShortcodes('All good :ok: and :up:')).toBe('All good :ok: and :up:');
  });

  it('leaves a flag name with an unknown country as written', () => {
    expect(replaceEmojiShortcodes(':flag-zz:')).toBe(':flag-zz:');
  });

  it('keeps the text around a shortcode in a URL or a word untouched', () => {
    expect(replaceEmojiShortcodes('see http://host:80:de/path')).toBe('see http://host:80:de/path');
  });
});
