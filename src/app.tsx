import alertService from '@jetbrains/ring-ui-built/components/alert-service/alert-service';
import React, {Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';

import {NavigationProvider} from './routing/navigation';
import {SearchPaletteProvider} from './components/search-palette/search-palette-context';
import type {BlogConfig} from './data/types';
import {useHost} from './api/host-context';
import {appLocationBus} from './api/app-location-bus';
import type {AppLocation} from './api/host';
import type {Route} from './routing/routing';
import {routeToLocation, locationToRoute, routeIdentity, serializeLocation, slugify} from './routing/routing';
import {SetupRequired} from './components/setup-required/setup-required';
import {AppHeader} from './components/app-header/app-header';
import {Page} from './components/page/page';
import {ErrorBoundary} from './components/error-state/error-boundary';
import {ErrorState} from './components/error-state/error-state';
import {PostPageSkeleton} from './pages/post/post-page-skeleton';
import {BlogListPage} from './pages/blog-list/blog-list-page';
import {FeedPage} from './pages/feed/feed-page';
import {LazyPostPage} from './pages/post/lazy-post-page';

interface AppProps {
  config: BlogConfig | null;
  initialLocation: AppLocation | null;
}

type PostRoute = Extract<Route, {name: 'post'}>;

interface AppView {
  list: Route | null;
  post: PostRoute | null;
}

function renderPostError(reset: () => void): React.ReactNode {
  return <ErrorState message="This post could not be shown." onRetry={reset}/>;
}

function toView(route: Route): AppView {
  return route.name === 'post' ? {list: null, post: route} : {list: route, post: null};
}

function nextView(previous: AppView, next: Route): AppView {
  return next.name === 'post' ? {list: previous.list, post: next} : {list: next, post: null};
}

const App: React.FunctionComponent<AppProps> = ({config, initialLocation}) => {
  const host = useHost();
  const [view, setView] = useState<AppView>(() => toView(initialLocation ? locationToRoute(initialLocation) : {name: 'blog-list'}));
  const route = view.post ?? view.list ?? {name: 'blog-list'};
  const currentLocationRef = useRef<string>(initialLocation ? serializeLocation(initialLocation) : '');
  const routeRef = useRef<Route>(route);
  const listScrollRef = useRef<{identity: string; top: number} | null>(null);
  const restoreScrollRef = useRef(false);

  const showRoute = useCallback((next: Route, restoreScroll: boolean) => {
    const current = routeRef.current;
    if (current.name !== 'post') {
      listScrollRef.current = {identity: routeIdentity(current), top: document.scrollingElement?.scrollTop ?? 0};
    }
    restoreScrollRef.current = restoreScroll;
    routeRef.current = next;
    setView(previous => nextView(previous, next));
  }, []);

  const applyLocation = (next: Route, push: boolean) => {
    const location = routeToLocation(next);
    currentLocationRef.current = serializeLocation(location);
    showRoute(next, false);
    const nav = host.navigation;
    if (nav) {
      const promise = push ? nav.updateAppLocation(location) : nav.replaceAppLocation(location);
      promise.catch(() => alertService.warning('The address of the page could not be updated.'));
    }
  };

  const identity = routeIdentity(route);
  const isPost = route.name === 'post';

  useLayoutEffect(() => {
    const saved = listScrollRef.current;
    const restore = restoreScrollRef.current && !isPost && saved?.identity === identity;
    restoreScrollRef.current = false;
    document.scrollingElement?.scrollTo({top: restore && saved ? saved.top : 0});
  }, [identity, isPost]);

  useEffect(() => appLocationBus.subscribe(location => {
    const key = serializeLocation(location);
    if (key === currentLocationRef.current) {return;}
    currentLocationRef.current = key;
    showRoute(locationToRoute(location), true);
  }), [showRoute]);

  const goToFeed = (blogId: string) => {
    applyLocation({name: 'feed', blogId}, true);
  };

  const goToPost = (postId: string, replyToCommentId?: string, title?: string, focusCommentId?: string) => {
    const slug = title ? slugify(title) : '';
    applyLocation({name: 'post', postId, replyToCommentId, focusCommentId, slug: slug || undefined}, true);
  };

  const goToComments = (postId: string, title?: string) => {
    const slug = title ? slugify(title) : '';
    applyLocation({name: 'post', postId, comments: true, slug: slug || undefined}, true);
  };

  const goToBlogList = (rubricId?: string, rubricName?: string, authorLogin?: string) => {
    const slug = rubricName ? slugify(rubricName) : '';
    applyLocation({name: 'blog-list', rubricId, rubricSlug: slug || undefined, authorLogin}, true);
  };

  const goToAuthor = (authorLogin: string) => {
    applyLocation({name: 'blog-list', authorLogin}, true);
  };

  const navigationState = {goToFeed, goToPost, goToComments, goToBlogList, goToAuthor};

  if (!config) {
    return <SetupRequired/>;
  }

  const renderListPage = (target: Route) => {
    if (target.name === 'feed') {
      return <FeedPage blogId={target.blogId} config={config}/>;
    }
    if (target.name === 'blog-list') {
      return <BlogListPage config={config} rubricId={target.rubricId} authorLogin={target.authorLogin}/>;
    }
    return null;
  };

  const listRoute = view.list;

  return (
    <NavigationProvider value={navigationState}>
      <SearchPaletteProvider config={config} route={route}>
        <Page wide>
          <AppHeader route={route} config={config}/>
          {listRoute && (
            <div key={routeIdentity(listRoute)} hidden={isPost}>
              {renderListPage(listRoute)}
            </div>
          )}
          {route.name === 'post' && (
            <ErrorBoundary
              key={route.postId}
              fallback={renderPostError}
            >
              <Suspense fallback={<PostPageSkeleton/>}>
                <LazyPostPage key={route.postId} postId={route.postId} replyToCommentId={route.replyToCommentId} focusCommentId={route.focusCommentId} scrollToComments={route.comments} config={config}/>
              </Suspense>
            </ErrorBoundary>
          )}
        </Page>
      </SearchPaletteProvider>
    </NavigationProvider>
  );
};

export default App;
