import React from 'react';

import styles from './badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
}

export const Badge: React.FunctionComponent<BadgeProps> = ({children}) => (
  <span className={styles.badge}>{children}</span>
);
