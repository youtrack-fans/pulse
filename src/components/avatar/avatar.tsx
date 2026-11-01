import React, {useState} from 'react';

import {getInitials} from '../../lib/utils';
import {SmoothImage} from '../smooth-image/smooth-image';

import styles from './avatar.module.css';

type AvatarSize = 28 | 30 | 36 | 42 | 46;

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: AvatarSize;
}

const SIZE_CLASS: Readonly<Record<AvatarSize, string>> = {
  28: styles.size28,
  30: styles.size30,
  36: styles.size36,
  42: styles.size42,
  46: styles.size46,
};

export const Avatar: React.FunctionComponent<AvatarProps> = ({name, avatarUrl, size = 36}) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (avatarUrl && avatarUrl !== failedUrl) {
    const handleError = () => setFailedUrl(avatarUrl);
    return <SmoothImage src={avatarUrl} className={`${styles.avatar} ${SIZE_CLASS[size]}`} onError={handleError}/>;
  }

  return (
    <span className={`${styles.avatar} ${styles.initials} ${SIZE_CLASS[size]}`}>
      {getInitials(name)}
    </span>
  );
};
