import {describe, expect, it} from 'vitest';

import {nextTrapIndex} from './focus-trap';

describe('nextTrapIndex', () => {
  it('wraps from the last element to the first on Tab', () => {
    expect(nextTrapIndex(3, 4, false)).toBe(0);
  });

  it('leaves Tab to the browser inside the dialog', () => {
    expect(nextTrapIndex(1, 4, false)).toBeNull();
  });

  it('wraps from the first element to the last on Shift+Tab', () => {
    expect(nextTrapIndex(0, 4, true)).toBe(3);
  });

  it('pulls focus back into the dialog when it is outside of the focusable elements', () => {
    expect(nextTrapIndex(-1, 4, true)).toBe(3);
  });

  it('leaves Shift+Tab to the browser inside the dialog', () => {
    expect(nextTrapIndex(2, 4, true)).toBeNull();
  });

  it('does nothing without focusable elements', () => {
    expect(nextTrapIndex(-1, 0, false)).toBeNull();
    expect(nextTrapIndex(-1, 0, true)).toBeNull();
  });
});
