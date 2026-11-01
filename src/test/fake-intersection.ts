import {act} from '@testing-library/react';
import {vi} from 'vitest';

interface Watcher {
  callback: IntersectionObserverCallback;
  disconnected: boolean;
}

let watchers: Watcher[] = [];

class FakeIntersectionObserver {
  private readonly watcher: Watcher;

  constructor(callback: IntersectionObserverCallback) {
    this.watcher = {callback, disconnected: false};
    watchers.push(this.watcher);
  }

  observe(): void {}

  unobserve(): void {}

  disconnect(): void {
    this.watcher.disconnected = true;
  }

  takeRecords(): [] {
    return [];
  }
}

export function installFakeIntersectionObserver(): void {
  watchers = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
}

export function activeWatcherCount(): number {
  return watchers.filter(watcher => !watcher.disconnected).length;
}

export function scrollToEnd(): void {
  act(() => {
    watchers.filter(watcher => !watcher.disconnected).forEach(watcher => {
      watcher.callback([{isIntersecting: true}] as IntersectionObserverEntry[], {} as IntersectionObserver);
    });
  });
}
