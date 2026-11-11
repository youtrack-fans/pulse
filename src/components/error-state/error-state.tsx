import React from 'react';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import styles from './error-state.module.css';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export const ErrorState: React.FunctionComponent<ErrorStateProps> = ({title, message, onRetry, children}) => (
  <div className={styles.container}>
    <Text size={Text.Size.L}>{title || 'Something went wrong'}</Text>
    <Text size={Text.Size.M} className={styles.detail}>
      {message || 'The content could not be loaded. Please try again.'}
    </Text>
    {onRetry && (
      <Button primary onClick={onRetry}>Retry</Button>
    )}
    {children}
  </div>
);
