import React, {useEffect, useState} from 'react';
import Text from '@jetbrains/ring-ui-built/components/text/text';

import {useHost} from '../../api/host-context';
import {AppConfigRepository} from '../../data/config/app-config-repository';
import {Page} from '../page/page';
import {PageHeader} from '../page-header/page-header';
import styles from './setup-required.module.css';

export const SetupRequired: React.FunctionComponent = () => {
  const host = useHost();
  const [contextPath, setContextPath] = useState('');

  useEffect(() => {
    let cancelled = false;
    new AppConfigRepository(host).getContextPath().then(path => {
      if (!cancelled) {
        setContextPath(path);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [host]);

  return (
    <Page>
      <PageHeader title="Blog Setup Required">
        <div className={styles.content}>
          <Text size={Text.Size.M} className={styles.description}>
            To get started, an administrator needs to select the project whose articles will power the blog.
            Open Administration, Apps, Pulse, Settings and choose it under Blog Project.
          </Text>
          <a className={styles.link} href={`${contextPath}/admin/apps`} target="_top">Open Apps settings</a>
        </div>
      </PageHeader>
    </Page>
  );
};
