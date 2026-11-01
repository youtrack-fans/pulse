import React from 'react';
import RingBreadcrumbs from '@jetbrains/ring-ui-built/components/breadcrumbs/breadcrumbs';
import Link from '@jetbrains/ring-ui-built/components/link/link';

import styles from './breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  wide?: boolean;
}

export const Breadcrumbs: React.FunctionComponent<BreadcrumbsProps> = ({items, wide}) => (
  <nav className={wide ? `${styles.nav} ${styles.wide}` : styles.nav} aria-label="Breadcrumb">
    <div className={styles.left}>
      <RingBreadcrumbs separatorClassName={styles.separator}>
        {items.map(item => {
          if (item.onClick) {
            return (
              <Link
                key={item.label}
                pseudo
                className={styles.link}
                onClick={item.onClick}
              >
                {item.label}
              </Link>
            );
          }

          return (
            <span key={item.label} className={styles.currentLabel} aria-current="page">
              {item.label}
            </span>
          );
        })}
      </RingBreadcrumbs>
    </div>
  </nav>
);
