import {useEffect, useRef, useState} from 'react';

const PRELOAD_MARGIN = '400px';

export function useInfiniteScroll(
  enabled: boolean,
  onLoadMore: () => void,
  renderedCount: number,
): (sentinel: HTMLElement | null) => void {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    if (!sentinel || !enabled) {
      return undefined;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        onLoadMoreRef.current();
      }
    }, {rootMargin: PRELOAD_MARGIN});
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, enabled, renderedCount]);

  return setSentinel;
}
