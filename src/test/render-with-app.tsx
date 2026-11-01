import React from 'react';
import {render} from '@testing-library/react';
import type {ReactElement} from 'react';
import {vi} from 'vitest';

import type {HostAPI} from '../api/host';
import {HostProvider} from '../api/host-context';
import type {NavigationState} from '../routing/navigation';
import {NavigationProvider} from '../routing/navigation';

export function createNavigationSpy() {
  const navigation = {
    goToFeed: vi.fn<NavigationState['goToFeed']>(),
    goToPost: vi.fn<NavigationState['goToPost']>(),
    goToComments: vi.fn<NavigationState['goToComments']>(),
    goToBlogList: vi.fn<NavigationState['goToBlogList']>(),
    goToAuthor: vi.fn<NavigationState['goToAuthor']>(),
  };
  return navigation;
}

export function renderWithApp(ui: ReactElement, host: HostAPI) {
  const navigation = createNavigationSpy();
  const wrap = (node: ReactElement) => (
    <HostProvider value={host}>
      <NavigationProvider value={navigation}>{node}</NavigationProvider>
    </HostProvider>
  );
  const result = render(wrap(ui));
  return {...result, navigation, rerenderApp: (next: ReactElement) => result.rerender(wrap(next))};
}
