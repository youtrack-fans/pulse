import React, {useEffect, useState} from 'react';

import AppRoot from '../../app';
import {AppConfigRepository} from '../../data/config/app-config-repository';
import {HostProvider} from '../../api/host-context';
import {registerHost} from '../../api/index';
import {appLocationBus} from '../../api/app-location-bus';
import type {AppLocation, HostAPI} from '../../api/host';
import type {BlogAccess} from '../../data/config/config-repository';
import {ErrorState} from '../../components/error-state/error-state';
import {Page} from '../../components/page/page';
import {BlogNameContext} from '../../components/pulse-header/blog-name-context';
import {locationToRoute} from '../../routing/routing';
import {loadPostPage} from '../../pages/post/lazy-post-page';

export const App: React.FunctionComponent = () => {
  const [bootstrap, setBootstrap] = useState<{host: HostAPI; access: BlogAccess; location: AppLocation | null} | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const register = async () => {
      let changedLocation: AppLocation | null = null;
      const host = await registerHost({
        onAppLocationChange: (location) => {
          changedLocation = location;
          appLocationBus.emit(location);
        },
      });
      const locationRequest = host.navigation ? host.navigation.getAppLocation().catch(() => null) : Promise.resolve(null);
      locationRequest.then(found => {
        if (found && locationToRoute(found).name === 'post') {
          loadPostPage().catch(() => undefined);
        }
      });
      const [access, location] = await Promise.all([new AppConfigRepository(host).getConfig(), locationRequest]);
      if (cancelled) {return;}
      setBootstrap({host, access, location: changedLocation ?? location});
    };
    register().catch(() => {
      if (!cancelled) {setFailed(true);}
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <Page wide>
        <ErrorState message="Pulse could not start. Reload the page to try again."/>
      </Page>
    );
  }

  if (!bootstrap) {
    return null;
  }

  const config = bootstrap.access.status === 'ready' ? bootstrap.access.config : null;

  return (
    <HostProvider value={bootstrap.host}>
      <BlogNameContext.Provider value={config?.blogName || 'Pulse'}>
        <AppRoot config={config} accessDenied={bootstrap.access.status === 'forbidden'} initialLocation={bootstrap.location}/>
      </BlogNameContext.Provider>
    </HostProvider>
  );
};
