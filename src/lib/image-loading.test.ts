import {describe, expect, it, vi} from 'vitest';

import {hasLoadedBefore, readImageSize, trackImageLoad, withImageSize} from './image-loading';

type Listener = () => void;

function fakeImage(complete: boolean) {
  const listeners = new Map<string, Listener>();
  return {
    complete,
    dataset: {} as DOMStringMap,
    listeners,
    addEventListener: vi.fn((type: string, listener: Listener) => {
      listeners.set(type, listener);
    }),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type);
    }),
  };
}

describe('withImageSize', () => {
  it('appends the size from the attachment metadata', () => {
    expect(withImageSize('/api/files/1?sign=x', 'rw=4000&rh=2667')).toBe('/api/files/1?sign=x#pulse-size=4000x2667');
  });

  it('reads the size whatever the order of the metadata keys', () => {
    expect(withImageSize('/f', 'rh=2667&rw=4000')).toBe('/f#pulse-size=4000x2667');
    expect(withImageSize('/f', 'rw=4000&x=1&rh=2667')).toBe('/f#pulse-size=4000x2667');
  });

  it('ignores a zero or partial size', () => {
    expect(withImageSize('/f', 'rw=0&rh=0')).toBe('/f');
    expect(withImageSize('/f', 'rw=4000')).toBe('/f');
  });

  it('leaves the url alone when the metadata has no size', () => {
    expect(withImageSize('/api/files/1', 'empty')).toBe('/api/files/1');
    expect(withImageSize('/api/files/1', undefined)).toBe('/api/files/1');
  });
});

describe('readImageSize', () => {
  it('reads the size back from the url fragment', () => {
    expect(readImageSize('/api/files/1?sign=x#pulse-size=960x1280')).toEqual({width: '960', height: '1280'});
  });

  it('returns null for a zero size', () => {
    expect(readImageSize('/f#pulse-size=0x0')).toBeNull();
  });

  it('returns null without a size fragment', () => {
    expect(readImageSize('/api/files/1?sign=x')).toBeNull();
  });
});

describe('trackImageLoad', () => {
  function clock(start = 0) {
    let time = start;
    return {now: () => time, advance: (ms: number) => { time += ms; }};
  }

  it('marks an image that is already loaded as instant, without waiting for events', () => {
    const image = fakeImage(true);

    trackImageLoad(image, '');

    expect(image.dataset.loaded).toBe('instant');
    expect(image.addEventListener).not.toHaveBeenCalled();
  });

  it('leaves a pending image unmarked and fades it in when it loads slowly', () => {
    const image = fakeImage(false);
    const time = clock();

    trackImageLoad(image, '', time.now);
    expect(image.dataset.loaded).toBeUndefined();

    time.advance(300);
    image.listeners.get('load')?.();

    expect(image.dataset.loaded).toBe('fade');
  });

  it('shows an image that loads within a few frames without the fade', () => {
    const image = fakeImage(false);
    const time = clock();

    trackImageLoad(image, '', time.now);
    time.advance(40);
    image.listeners.get('load')?.();

    expect(image.dataset.loaded).toBe('instant');
  });

  it('waits for the decoded bitmap before it ends the placeholder', async () => {
    const image = {...fakeImage(false), decode: vi.fn(() => Promise.resolve())};
    const time = clock();

    trackImageLoad(image, '', time.now);
    time.advance(300);
    image.listeners.get('load')?.();

    expect(image.decode).toHaveBeenCalled();
    expect(image.dataset.loaded).toBeUndefined();
    await Promise.resolve();
    expect(image.dataset.loaded).toBe('fade');
  });

  it('also ends the placeholder when the image fails', () => {
    const image = fakeImage(false);
    const time = clock();

    trackImageLoad(image, '', time.now);
    time.advance(300);
    image.listeners.get('error')?.();

    expect(image.dataset.loaded).toBe('fade');
  });

  it('resets a previous state when the source changes', () => {
    const image = fakeImage(false);
    image.dataset.loaded = 'fade';

    trackImageLoad(image, '');

    expect(image.dataset.loaded).toBeUndefined();
  });

  it('removes its listeners on cleanup', () => {
    const image = fakeImage(false);

    trackImageLoad(image, '')();

    expect(image.listeners.size).toBe(0);
  });

  it('shows a source that loaded before at once, whatever its size fragment', () => {
    const first = fakeImage(false);
    trackImageLoad(first, '/api/files/9-1?sign=a&updated=5#pulse-size=4000x2667');
    first.listeners.get('load')?.();

    expect(hasLoadedBefore('/api/files/9-1?sign=a&updated=5')).toBe(true);

    const second = fakeImage(false);
    trackImageLoad(second, '/api/files/9-1?sign=a&updated=5');

    expect(second.dataset.loaded).toBe('instant');
    expect(second.addEventListener).not.toHaveBeenCalled();
  });

  it('treats a renewed signature as a new download, like the browser cache does', () => {
    const image = fakeImage(false);
    trackImageLoad(image, '/api/files/9-5?sign=a&updated=5');
    image.listeners.get('load')?.();

    expect(hasLoadedBefore('/api/files/9-5?sign=b&updated=5')).toBe(false);
  });

  it('does not remember a source that failed', () => {
    const image = fakeImage(false);
    trackImageLoad(image, '/api/files/9-2?sign=a');
    image.listeners.get('error')?.();

    expect(hasLoadedBefore('/api/files/9-2?sign=a')).toBe(false);
  });
});
