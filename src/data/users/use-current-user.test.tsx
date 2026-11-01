import React from 'react';
import {renderHook, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {HostProvider} from '../../api/host-context';
import {createFakeHost} from '../../test/fake-host';
import {useCurrentUser} from './use-current-user';

const tester = {login: 'tester', fullName: 'Tester', avatarUrl: '', ringId: ''};

function createUserHost(handler: () => unknown = () => tester) {
  const fake = createFakeHost(route => {
    if (route === 'users/me') {
      return handler();
    }
    throw new Error(`unexpected request ${route}`);
  });
  const wrapper = ({children}: {children: React.ReactNode}) => <HostProvider value={fake.host}>{children}</HostProvider>;
  return {...fake, wrapper};
}

describe('useCurrentUser', () => {
  it('shares one request between mounts and serves later mounts from the cache at once', async () => {
    const {calls, wrapper} = createUserHost();
    const first = renderHook(() => useCurrentUser(), {wrapper});
    const second = renderHook(() => useCurrentUser(), {wrapper});
    await waitFor(() => expect(first.result.current?.login).toBe('tester'));
    await waitFor(() => expect(second.result.current?.login).toBe('tester'));
    first.unmount();

    const third = renderHook(() => useCurrentUser(), {wrapper});
    expect(third.result.current?.login).toBe('tester');
    expect(calls.filter(call => call.startsWith('users/me'))).toHaveLength(1);
  });

  it('retries on the next mount when the request failed', async () => {
    let fail = true;
    const {calls, wrapper} = createUserHost(() => {
      if (fail) {
        throw new Error('users request failed');
      }
      return tester;
    });
    const failed = renderHook(() => useCurrentUser(), {wrapper});
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(failed.result.current).toBeNull();
    failed.unmount();

    fail = false;
    const retried = renderHook(() => useCurrentUser(), {wrapper});
    await waitFor(() => expect(retried.result.current?.login).toBe('tester'));
    expect(calls).toHaveLength(2);
  });
});
