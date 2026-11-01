import React, {useEffect, useRef} from 'react';

import type {BlogConfig} from '../../data/types';
import {useBlogs} from '../../data/articles/use-blogs';
import {loadProjectIndex} from '../../data/articles/project-index';
import {useHost} from '../../api/host-context';
import {buildHeaderState} from '../../lib/header-state';
import type {Route} from '../../routing/routing';
import {useNavigation} from '../../routing/navigation';
import {PulseHeader} from '../pulse-header/pulse-header';

interface AppHeaderProps {
  route: Route;
  config: BlogConfig;
}

export const AppHeader: React.FunctionComponent<AppHeaderProps> = ({route, config}) => {
  const host = useHost();
  const {goToBlogList, goToFeed} = useNavigation();
  const {blogs, stubs, loading, error, retry} = useBlogs(config);
  const refreshedFor = useRef<string | null>(null);
  const missingPostId = route.name === 'post' && !loading && blogs.length > 0 && !stubs.some(stub => stub.id === route.postId)
    ? route.postId
    : null;

  useEffect(() => {
    if (missingPostId && refreshedFor.current !== missingPostId) {
      refreshedFor.current = missingPostId;
      loadProjectIndex(host, config.projectShortName, true).catch(() => {});
    }
  }, [host, config.projectShortName, missingPostId]);

  const header = buildHeaderState(route, blogs, stubs, {goToBlogList, goToFeed});
  const goHome = () => goToBlogList();

  return <PulseHeader {...header} navLoading={loading} navError={error} onNavRetry={retry} onBrandClick={goHome}/>;
};
