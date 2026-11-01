import React from 'react';

import {Breadcrumbs, type BreadcrumbItem} from '../breadcrumbs/breadcrumbs';
import styles from './page-header.module.css';

interface PageHeaderProps {
  title: React.ReactNode;
  breadcrumbs?: readonly BreadcrumbItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  wide?: boolean;
  titleClassName?: string;
  titleId?: string;
}

export const PageHeader: React.FunctionComponent<PageHeaderProps> = ({
  title,
  breadcrumbs,
  actions,
  children,
  wide,
  titleClassName,
  titleId,
}) => (
  <header className={styles.header}>
    {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} wide={wide}/>}
    <div className={wide ? `${styles.section} ${styles.sectionWide}` : styles.section}>
      <div className={styles.main}>
        <h1
          id={titleId}
          className={titleClassName ? `${styles.title} ${titleClassName}` : styles.title}
        >
          {title}
        </h1>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children && <div className={styles.content}>{children}</div>}
    </div>
  </header>
);
