import {cleanup} from '@testing-library/react';
import {afterEach, vi} from 'vitest';

class FakeObserver {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}

  takeRecords(): [] {
    return [];
  }
}

vi.stubGlobal('IntersectionObserver', FakeObserver);
vi.stubGlobal('ResizeObserver', FakeObserver);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

vi.mock('../api/index', () => ({
  createApi: () => ({
    global: {
      reactions: {POST: async () => ({items: [], me: 'tester'})},
      like: {POST: async () => ({items: [], me: 'tester'})},
      unlike: {POST: async () => ({items: [], me: 'tester'})},
      settings: {GET: async () => ({configured: false, project: null})},
    },
  }),
  registerHost: async () => {
    throw new Error('registerHost is not faked');
  },
}));

afterEach(() => {
  cleanup();
});
