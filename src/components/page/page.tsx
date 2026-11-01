import React from 'react';

import styles from './page.module.css';

interface PageProps {
  children: React.ReactNode;
  wide?: boolean;
}

export const Page: React.FunctionComponent<PageProps> = ({children, wide}) => (
  <div className={wide ? styles.pageWide : styles.page}>
    {children}
  </div>
);
