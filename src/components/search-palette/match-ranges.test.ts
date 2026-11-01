import {describe, expect, it} from 'vitest';

import {findMatches} from './match-ranges';

describe('findMatches', () => {
  it('finds every occurrence ignoring case', () => {
    expect(findMatches('Kotlin and kotlin', 'KOTLIN')).toEqual([{start: 0, end: 6}, {start: 11, end: 17}]);
  });

  it('returns nothing for an empty or blank query', () => {
    expect(findMatches('text', '')).toEqual([]);
    expect(findMatches('text', '   ')).toEqual([]);
  });

  it('ignores the whitespace around the query', () => {
    expect(findMatches('a b c', '  b  ')).toEqual([{start: 2, end: 3}]);
  });

  it('treats regular expression characters literally', () => {
    expect(findMatches('c++ (beta) a.b', '(beta)')).toEqual([{start: 4, end: 10}]);
    expect(findMatches('a.b axb', 'a.b')).toEqual([{start: 0, end: 3}]);
  });

  it('keeps the offsets right after a character whose lowercase form is longer', () => {
    expect(findMatches('İstanbul trip', 'trip')).toEqual([{start: 9, end: 13}]);
  });

  it('matches non-Latin text', () => {
    expect(findMatches('Привет, МИР', 'мир')).toEqual([{start: 8, end: 11}]);
  });

  it('returns nothing when the text does not contain the query', () => {
    expect(findMatches('hello', 'x')).toEqual([]);
  });
});
