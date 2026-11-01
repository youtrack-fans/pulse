import {describe, expect, it} from 'vitest';

import {LIKE_REACTION} from '../config/constants';
import {isValidReaction, SUPPORTED_REACTIONS} from './reactions';

describe('reactions', () => {
  it('lets the backend accept the reaction the frontend sends for a like', () => {
    expect(SUPPORTED_REACTIONS).toContain(LIKE_REACTION);
    expect(isValidReaction(LIKE_REACTION)).toBe(true);
  });

  it('rejects unknown and non-string reactions', () => {
    expect(isValidReaction('👍')).toBe(false);
    expect(isValidReaction(1)).toBe(false);
    expect(isValidReaction(undefined)).toBe(false);
  });
});
