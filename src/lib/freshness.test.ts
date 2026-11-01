import {describe, expect, it} from 'vitest';

import {isFresh} from './freshness';

describe('isFresh', () => {
  it('is true right after the fetch', () => {
    expect(isFresh(1000, 1000, 60_000)).toBe(true);
  });

  it('is true just inside the window', () => {
    expect(isFresh(1000, 60_999, 60_000)).toBe(true);
  });

  it('is false once the window has passed', () => {
    expect(isFresh(1000, 61_000, 60_000)).toBe(false);
  });

  it('uses the shared window of sixty seconds by default', () => {
    expect(isFresh(0, 59_999)).toBe(true);
    expect(isFresh(0, 60_000)).toBe(false);
  });
});
