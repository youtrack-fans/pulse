import React from 'react';

import shimmerStyles from '../../components/skeleton/shimmer.module.css';
import commentStyles from '../../components/comment-section/comment-section.module.css';
import pageStyles from './post-page.module.css';
import styles from './post-page-skeleton.module.css';

const TITLE_ROWS = [
  {id: 'first', width: styles.w88},
  {id: 'second', width: styles.w60},
];
const TEXT_ROWS = [
  {id: 'a1', width: styles.w100, gap: false},
  {id: 'a2', width: styles.w96, gap: false},
  {id: 'a3', width: styles.w88, gap: false},
  {id: 'a4', width: styles.w45, gap: true},
  {id: 'b1', width: styles.w100, gap: false},
  {id: 'b2', width: styles.w96, gap: false},
  {id: 'b3', width: styles.w72, gap: true},
  {id: 'c1', width: styles.w100, gap: false},
  {id: 'c2', width: styles.w88, gap: false},
  {id: 'c3', width: styles.w96, gap: false},
  {id: 'c4', width: styles.w100, gap: false},
  {id: 'c5', width: styles.w60, gap: true},
  {id: 'd1', width: styles.w96, gap: false},
  {id: 'd2', width: styles.w100, gap: false},
  {id: 'd3', width: styles.w88, gap: false},
  {id: 'd4', width: styles.w72, gap: false},
];
const COMMENTS = [
  {id: 'first', lines: [{id: 'a', width: styles.w100}, {id: 'b', width: styles.w72}]},
  {id: 'second', lines: [{id: 'a', width: styles.w88}]},
];

const bar = (...classNames: string[]) => <span className={[shimmerStyles.shimmer, ...classNames].join(' ')}/>;

export const PostPageSkeleton: React.FunctionComponent = () => (
  <div className={pageStyles.layout} aria-hidden="true">
    <div className={pageStyles.mainColumn}>
      <article className={pageStyles.hero}>
        <div className={pageStyles.heroHead}>
          {bar(styles.avatar46)}
          <div className={pageStyles.who}>
            {bar(styles.name)}
            {bar(styles.meta)}
          </div>
        </div>

        <div className={styles.titleRows}>
          {TITLE_ROWS.map(({id, width}) => (
            <div key={id} className={styles.titleRow}>{bar(styles.titleBar, width)}</div>
          ))}
        </div>

        {bar(styles.media)}

        {TEXT_ROWS.map(({id, width, gap}) => (
          <React.Fragment key={id}>
            <div className={styles.textRow}>{bar(styles.textBar, width)}</div>
            {gap && <div className={styles.paragraphGap}/>}
          </React.Fragment>
        ))}

        <div className={pageStyles.footer}>
          {bar(styles.action)}
          {bar(styles.action)}
          {bar(styles.action, styles.actionEnd)}
        </div>
      </article>

      <div className={commentStyles.head}>{bar(styles.heading)}</div>

      <div className={commentStyles.composer}>
        {bar(styles.avatar36)}
        {bar(styles.field)}
      </div>

      {COMMENTS.map(({id, lines}) => (
        <div key={id} className={commentStyles.thread}>
          <div className={commentStyles.comment}>
            {bar(styles.avatar36)}
            <div className={styles.commentBody}>
              {bar(styles.commentName)}
              {lines.map(({id: lineId, width}) => <React.Fragment key={lineId}>{bar(styles.commentLine, width)}</React.Fragment>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
