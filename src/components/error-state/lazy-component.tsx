import React, {lazy, type ComponentType} from 'react';

import {ErrorState} from './error-state';

const reloadPage = () => window.location.reload();

const ChunkFailed: React.FunctionComponent = () => (
  <ErrorState message="Part of Pulse could not be loaded. Reload the page to try again." onRetry={reloadPage}/>
);

export function lazyComponent<P extends object>(load: () => Promise<{default: ComponentType<P>}>) {
  return lazy<ComponentType<P>>(() => load().catch((): {default: ComponentType<P>} => ({default: ChunkFailed})));
}
