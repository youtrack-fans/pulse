import React, {useLayoutEffect, useRef} from 'react';

import {hasLoadedBefore, readImageSize, trackImageLoad} from '../../lib/image-loading';

import styles from './smooth-image.module.css';

interface SmoothImageProps {
  src: string;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}

export const SmoothImage: React.FunctionComponent<SmoothImageProps> = ({src, className, priority = false, onError}) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const size = readImageSize(src);
  const loadedBefore = hasLoadedBefore(src);

  useLayoutEffect(() => {
    const image = imageRef.current;
    return image ? trackImageLoad(image, src) : undefined;
  }, [src]);

  return (
    <span className={className ? `${styles.frame} ${className}` : styles.frame}>
      <img
        ref={imageRef}
        src={src}
        alt=""
        width={size?.width}
        height={size?.height}
        className={styles.image}
        loading={priority || loadedBefore ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        data-loaded={loadedBefore ? 'instant' : undefined}
        onError={onError}
      />
    </span>
  );
};
