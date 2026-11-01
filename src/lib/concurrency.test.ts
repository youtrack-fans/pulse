import {describe, expect, it} from 'vitest';

import {mapWithConcurrency} from './concurrency';

function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return {promise, resolve};
}

describe('mapWithConcurrency', () => {
  it('returns the results in the order of the items', async () => {
    const result = await mapWithConcurrency([3, 1, 2], 2, async value => value * 10);
    expect(result).toEqual([30, 10, 20]);
  });

  it('never runs more tasks at once than the limit', async () => {
    let running = 0;
    let peak = 0;
    await mapWithConcurrency(Array.from({length: 10}, (_unused, index) => index), 3, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await Promise.resolve();
      await Promise.resolve();
      running -= 1;
    });
    expect(peak).toBe(3);
  });

  it('starts the next task as soon as one finishes', async () => {
    const gates = [deferred(), deferred(), deferred()];
    const started: number[] = [];
    const done = mapWithConcurrency([0, 1, 2], 2, async index => {
      started.push(index);
      await gates[index].promise;
    });
    await Promise.resolve();
    expect(started).toEqual([0, 1]);
    gates[0].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(started).toEqual([0, 1, 2]);
    gates[1].resolve();
    gates[2].resolve();
    await done;
  });

  it('handles an empty list', async () => {
    expect(await mapWithConcurrency([], 4, async value => value)).toEqual([]);
  });
});
