import {describe, expect, it} from 'vitest';

import {shouldApplyTarget} from './comment-target';

describe('shouldApplyTarget', () => {
  it('applies a target that exists and was not applied yet', () => {
    expect(shouldApplyTarget('c2', null, true)).toBe(true);
  });

  it('does not apply the same target twice', () => {
    expect(shouldApplyTarget('c2', 'c2', true)).toBe(false);
  });

  it('applies a different target on the same post after the first one', () => {
    expect(shouldApplyTarget('c3', 'c2', true)).toBe(true);
  });

  it('waits until the comment is loaded', () => {
    expect(shouldApplyTarget('c2', null, false)).toBe(false);
  });
});
