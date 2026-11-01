import React from 'react';
import Text from '@jetbrains/ring-ui-built/components/text/text';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import styles from './error-state.module.css';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FunctionComponent<ErrorStateProps> = ({message, onRetry}) => (
  <div className={styles.container}>
    <Text size={Text.Size.L}>Something went wrong</Text>
    <Text size={Text.Size.M} className={styles.detail}>
      {message || 'The content could not be loaded. Please try again.'}
    </Text>
    {onRetry && (
      <Button primary onClick={onRetry}>Retry</Button>
    )}
  </div>
);
