import React from 'react';
import Text from '@jetbrains/ring-ui-built/components/text/text';

import {Page} from '../page/page';
import {PageHeader} from '../page-header/page-header';
import styles from './setup-required.module.css';

export const SetupRequired: React.FunctionComponent = () => (
  <Page>
    <PageHeader title="Blog Setup Required">
      <Text size={Text.Size.M} className={styles.description}>
        To get started, open the app settings and select a project whose articles will power the blog.
      </Text>
    </PageHeader>
  </Page>
);
