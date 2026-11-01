import {describe, expect, it} from 'vitest';

import {createRequestGeneration} from './request-generation';

describe('createRequestGeneration', () => {
  it('treats the token from the latest next call as current', () => {
    const generation = createRequestGeneration();
    const token = generation.next();
    expect(generation.isCurrent(token)).toBe(true);
  });

  it('marks an earlier token as stale after next is called again', () => {
    const generation = createRequestGeneration();
    const first = generation.next();
    generation.next();
    expect(generation.isCurrent(first)).toBe(false);
  });

  it('lets a request capture the current token without starting a new generation', () => {
    const generation = createRequestGeneration();
    generation.next();
    const captured = generation.current();
    expect(generation.isCurrent(captured)).toBe(true);
    generation.next();
    expect(generation.isCurrent(captured)).toBe(false);
  });

  it('keeps generations of separate instances independent', () => {
    const first = createRequestGeneration();
    const second = createRequestGeneration();
    const token = first.next();
    second.next();
    second.next();
    expect(first.isCurrent(token)).toBe(true);
  });
});
