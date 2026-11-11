import React from 'react';
import Text from '@jetbrains/ring-ui-built/components/text/text';

import {Page} from '../page/page';
import {PageHeader} from '../page-header/page-header';
import styles from './no-access.module.css';

export const NoAccess: React.FunctionComponent = () => (
  <Page>
    <PageHeader title="No Access to the Blog">
      <Text size={Text.Size.M} className={styles.description}>
        Your account cannot read the articles of the blog project.
        Ask a YouTrack administrator for read access to its articles.
      </Text>
    </PageHeader>
  </Page>
);
