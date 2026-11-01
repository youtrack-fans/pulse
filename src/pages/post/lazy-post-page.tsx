import React, {useEffect, type ComponentProps, type ComponentType} from 'react';

import {lazyComponent} from '../../components/error-state/lazy-component';
import type {PostPage} from './post-page';

type PostPageProps = ComponentProps<typeof PostPage>;

const loaded: {component: ComponentType<PostPageProps> | null} = {component: null};

export const loadPostPage = () => import('./post-page').then(module => {
  loaded.component = module.PostPage;
  return {default: module.PostPage};
});

const SuspendingPostPage = lazyComponent(loadPostPage);

export const LazyPostPage: React.FunctionComponent<PostPageProps> = props => (
  loaded.component ? <loaded.component {...props}/> : <SuspendingPostPage {...props}/>
);

export function usePrefetchPostPage(ready: boolean): void {
  useEffect(() => {
    if (ready) {
      loadPostPage().catch(() => undefined);
    }
  }, [ready]);
}
