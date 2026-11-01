import React from 'react';

import styles from './list-layout.module.css';

interface ListLayoutProps {
  sidebar: React.ReactNode;
  sentinelRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}

export const ListLayout: React.FunctionComponent<ListLayoutProps> = ({sidebar, sentinelRef, children}) => (
  <div className={styles.layout}>
    <div className={styles.stream}>
      {children}
      {sentinelRef && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true"/>}
    </div>
    {sidebar}
  </div>
);
