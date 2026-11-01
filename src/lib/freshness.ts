import {DATA_FRESH_MS} from '../config/constants';

export function isFresh(fetchedAt: number, now: number = Date.now(), windowMs: number = DATA_FRESH_MS): boolean {
  return now - fetchedAt < windowMs;
}
