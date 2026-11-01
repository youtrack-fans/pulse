import React, {useEffect, useLayoutEffect, useRef} from 'react';

import type {RenderedPostContent} from './render-post-content';
import {safeDecodeURIComponent} from '../../lib/utils';
import {trackImageLoad} from '../../lib/image-loading';

import styles from './post-content.module.css';

interface PostContentProps {
  renderedContent: RenderedPostContent;
}

export const PostContent: React.FunctionComponent<PostContentProps> = ({renderedContent}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    const onClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) {
        return;
      }
      event.preventDefault();
      const id = safeDecodeURIComponent(anchor.getAttribute('href')?.slice(1) ?? '');
      document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
    };
    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    const cleanups: Array<() => void> = [];
    container.querySelectorAll('img').forEach(image => {
      cleanups.push(trackImageLoad(image, image.getAttribute('src') ?? ''));
    });
    return () => cleanups.forEach(cleanup => cleanup());
  }, [renderedContent.html]);

  return (
    <div
      ref={containerRef}
      className={styles.content}
      dangerouslySetInnerHTML={{__html: renderedContent.html}}
    />
  );
};
