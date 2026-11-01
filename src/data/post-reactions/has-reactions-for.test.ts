import {describe, expect, it} from 'vitest';

import {hasReactionsFor} from './has-reactions-for';

describe('hasReactionsFor', () => {
  it('is true when every post has an entry, even an empty one', () => {
    expect(hasReactionsFor({a: [], b: []}, ['a', 'b'])).toBe(true);
  });

  it('is false when one post has no entry yet', () => {
    expect(hasReactionsFor({a: []}, ['a', 'b'])).toBe(false);
  });

  it('is true for no posts', () => {
    expect(hasReactionsFor({}, [])).toBe(true);
  });

  it('ignores entries of other posts', () => {
    expect(hasReactionsFor({x: []}, ['a'])).toBe(false);
  });
});
