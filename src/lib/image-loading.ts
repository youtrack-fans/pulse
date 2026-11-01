const IMAGE_SIZE_FRAGMENT = /#pulse-size=(\d+)x(\d+)$/;
const INSTANT_LOAD_MS = 120;

export interface ImageSize {
  width: string;
  height: string;
}

type TrackedImage = Pick<HTMLImageElement, 'complete' | 'dataset' | 'addEventListener' | 'removeEventListener'> &
  Partial<Pick<HTMLImageElement, 'naturalWidth' | 'decode'>>;

type Clock = () => number;

const loadedKeys = new Set<string>();

const defaultClock: Clock = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

function isDimension(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function toSize(width: unknown, height: unknown): ImageSize | null {
  return isDimension(Number(width)) && isDimension(Number(height)) ? {width: String(width), height: String(height)} : null;
}

function imageKey(src: string): string {
  return src.replace(IMAGE_SIZE_FRAGMENT, '');
}

function withSizeFragment(url: string, size: ImageSize | null): string {
  return size ? `${url}#pulse-size=${size.width}x${size.height}` : url;
}

export function withImageSize(url: string, metaData: string | undefined): string {
  const params = new URLSearchParams(metaData ?? '');
  return withSizeFragment(url, toSize(params.get('rw'), params.get('rh')));
}

export function readImageSize(src: string): ImageSize | null {
  const match = IMAGE_SIZE_FRAGMENT.exec(src);
  return match ? toSize(match[1], match[2]) : null;
}

export function hasLoadedBefore(src: string): boolean {
  return src !== '' && loadedKeys.has(imageKey(src));
}

export function trackImageLoad(image: TrackedImage, src: string, now: Clock = defaultClock): () => void {
  if (hasLoadedBefore(src)) {
    image.dataset.loaded = 'instant';
    return () => undefined;
  }
  delete image.dataset.loaded;
  const startedAt = now();
  let active = true;

  const finish = (loaded: boolean): void => {
    if (!active) {
      return;
    }
    active = false;
    image.dataset.loaded = now() - startedAt < INSTANT_LOAD_MS ? 'instant' : 'fade';
    if (loaded && src) {
      loadedKeys.add(imageKey(src));
    }
  };
  const onLoad = (): void => {
    if (typeof image.decode === 'function') {
      image.decode().then(() => finish(true), () => finish(true));
    } else {
      finish(true);
    }
  };
  const onError = (): void => finish(false);

  if (image.complete) {
    if ((image.naturalWidth ?? 1) > 0) {
      onLoad();
    } else {
      onError();
    }
  } else {
    image.addEventListener('load', onLoad, {once: true});
    image.addEventListener('error', onError, {once: true});
  }
  return () => {
    active = false;
    image.removeEventListener('load', onLoad);
    image.removeEventListener('error', onError);
  };
}
