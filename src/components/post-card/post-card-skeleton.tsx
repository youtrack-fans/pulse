import React from 'react';

import shimmerStyles from '../skeleton/shimmer.module.css';
import cardStyles from './post-card.module.css';
import styles from './post-card-skeleton.module.css';

interface PostCardSkeletonProps {
  withMedia?: boolean;
}

export const PostCardSkeleton: React.FunctionComponent<PostCardSkeletonProps> = ({withMedia = false}) => (
  <div className={cardStyles.card} aria-hidden="true">
    <div className={withMedia ? `${cardStyles.content} ${cardStyles.contentWithMedia}` : cardStyles.content}>
      <div className={cardStyles.head}>
        <span className={`${shimmerStyles.shimmer} ${styles.avatar42}`}/>
        <div className={cardStyles.who}>
          <div className={cardStyles.authorLine}>
            <span className={`${shimmerStyles.shimmer} ${styles.name}`}/>
            <span className={`${shimmerStyles.shimmer} ${styles.tag}`}/>
          </div>
          <span className={`${shimmerStyles.shimmer} ${styles.meta}`}/>
        </div>
      </div>
      <div className={styles.titleRow}>
        <span className={`${shimmerStyles.shimmer} ${styles.titleBar}`}/>
      </div>
      <div className={withMedia ? `${styles.excerpt} ${styles.excerptWithMedia}` : styles.excerpt}>
        <div className={styles.textRow}><span className={`${shimmerStyles.shimmer} ${styles.textBar} ${styles.textFull}`}/></div>
        <div className={styles.textRow}><span className={`${shimmerStyles.shimmer} ${styles.textBar} ${styles.textLong}`}/></div>
        <div className={styles.textRow}><span className={`${shimmerStyles.shimmer} ${styles.textBar} ${styles.textShort}`}/></div>
      </div>
    </div>

    {withMedia && <div className={`${cardStyles.media} ${shimmerStyles.shimmer} ${styles.media}`}/>}

    <div className={cardStyles.bottomContent}>
      <div className={cardStyles.actionsRow}>
        <span className={`${shimmerStyles.shimmer} ${styles.pill}`}/>
        <span className={`${shimmerStyles.shimmer} ${styles.pill}`}/>
        <span className={`${shimmerStyles.shimmer} ${styles.pill} ${styles.pillEnd}`}/>
      </div>
    </div>
  </div>
);

const SKELETONS = [{id: 'first', withMedia: true}, {id: 'second', withMedia: false}, {id: 'third', withMedia: true}];

export const PostCardSkeletons: React.FunctionComponent = () => (
  <div className={styles.stack}>
    {SKELETONS.map(({id, withMedia}) => <PostCardSkeleton key={id} withMedia={withMedia}/>)}
  </div>
);
