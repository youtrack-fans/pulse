import type {HostAPI} from '../api/host';

const PAGE_SIZE = 100;
const PARALLEL_PAGES = 4;
const MAX_ITEMS = 5000;

function fetchPage<T>(host: HostAPI, path: string, skip: number): Promise<readonly T[]> {
  return host.fetchYouTrack<readonly T[]>(`${path}&$skip=${skip}&$top=${PAGE_SIZE}`);
}

async function fetchRemainingPages<T>(host: HostAPI, path: string, skip: number): Promise<readonly T[]> {
  if (skip >= MAX_ITEMS) {
    const beyond = await host.fetchYouTrack<readonly T[]>(`${path}&$skip=${MAX_ITEMS}&$top=1`);
    if (beyond.length > 0) {
      throw new Error(`More than ${MAX_ITEMS} items cannot be loaded.`);
    }
    return [];
  }
  const offsets = Array.from({length: PARALLEL_PAGES}, (_unused, index) => skip + index * PAGE_SIZE)
    .filter(offset => offset < MAX_ITEMS);
  const items = (await Promise.all(offsets.map(offset => fetchPage<T>(host, path, offset)))).flat();
  if (items.length < offsets.length * PAGE_SIZE) {
    return items;
  }
  return [...items, ...await fetchRemainingPages<T>(host, path, skip + PARALLEL_PAGES * PAGE_SIZE)];
}

export async function fetchAllPages<T>(host: HostAPI, path: string): Promise<readonly T[]> {
  const first = await fetchPage<T>(host, path, 0);
  if (first.length < PAGE_SIZE) {
    return first;
  }
  return [...first, ...await fetchRemainingPages<T>(host, path, PAGE_SIZE)];
}
