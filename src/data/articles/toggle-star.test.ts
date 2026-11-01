import {describe, expect, it} from 'vitest';

import {toggleStarOptimistic} from './toggle-star';

describe('toggleStarOptimistic', () => {
  it('applies the new state before the request finishes', async () => {
    const applied: boolean[] = [];
    let release: () => void = () => {};
    const pending = new Promise<void>(resolve => {
      release = resolve;
    });
    const result = toggleStarOptimistic({toggleStar: () => pending}, 'p1', true, value => applied.push(value));
    expect(applied).toEqual([true]);
    release();
    await result;
    expect(applied).toEqual([true]);
  });

  it('sends the post id and the new state', async () => {
    const calls: Array<[string, boolean]> = [];
    await toggleStarOptimistic({toggleStar: async (id, value) => {
      calls.push([id, value]);
    }}, 'p1', false, () => {});
    expect(calls).toEqual([['p1', false]]);
  });

  it('reverts the state when the request fails', async () => {
    const applied: boolean[] = [];
    await toggleStarOptimistic({toggleStar: () => Promise.reject(new Error('denied'))}, 'p1', true, value => applied.push(value));
    expect(applied).toEqual([true, false]);
  });
});
