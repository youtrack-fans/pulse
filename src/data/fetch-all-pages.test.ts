import {describe, expect, it} from 'vitest';

import {fetchAllPages} from './fetch-all-pages';
import {createFakeHost, sliceByParams} from '../test/fake-host';

function itemsHost(total: number) {
  const items = Array.from({length: total}, (_unused, index) => index);
  return createFakeHost((_route, params) => sliceByParams(items, params));
}

function skips(calls: readonly string[]): number[] {
  return calls.map(call => Number(new URLSearchParams(call.split('?')[1]).get('$skip')));
}

describe('fetchAllPages', () => {
  it('requests one page when the first page is not full', async () => {
    const {host, calls} = itemsHost(99);

    const result = await fetchAllPages<number>(host, 'articles?fields=id');

    expect(result).toHaveLength(99);
    expect(skips(calls)).toEqual([0]);
  });

  it('fetches the remaining pages in a parallel wave after the first page', async () => {
    const {host, calls} = itemsHost(250);

    const result = await fetchAllPages<number>(host, 'articles?fields=id');

    expect(result).toHaveLength(250);
    expect(skips(calls)).toEqual([0, 100, 200, 300, 400]);
  });

  it('keeps items in order', async () => {
    const {host} = itemsHost(430);

    const result = await fetchAllPages<number>(host, 'articles?fields=id');

    expect(result).toEqual(Array.from({length: 430}, (_unused, index) => index));
  });

  it('returns every item when the collection ends exactly at the item cap', async () => {
    const {host} = itemsHost(5000);

    const result = await fetchAllPages<number>(host, 'articles?fields=id');

    expect(result).toHaveLength(5000);
  });

  it('fails instead of silently cutting the collection beyond the item cap', async () => {
    const {host} = itemsHost(5300);

    await expect(fetchAllPages<number>(host, 'articles?fields=id')).rejects.toThrow('More than 5000 items');
  });

  it('stops after a full wave when the collection ends exactly on it', async () => {
    const {host, calls} = itemsHost(500);

    const result = await fetchAllPages<number>(host, 'articles?fields=id');

    expect(result).toHaveLength(500);
    expect(skips(calls)).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800]);
  });
});
