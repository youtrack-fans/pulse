import {useEffect, useState} from 'react';

import type {Author} from '../types';
import type {HostAPI} from '../../api/host';
import {useHost} from '../../api/host-context';
import {YtUsersRepository} from './yt-users-repository';

const usersByHost = new WeakMap<HostAPI, Author>();
const requestsByHost = new WeakMap<HostAPI, Promise<Author | null>>();

function loadCurrentUser(host: HostAPI): Promise<Author | null> {
  const pending = requestsByHost.get(host);
  if (pending) {
    return pending;
  }
  const request = new YtUsersRepository(host).getCurrentUser()
    .then(user => {
      usersByHost.set(host, user);
      return user;
    })
    .catch(() => null)
    .finally(() => {
      requestsByHost.delete(host);
    });
  requestsByHost.set(host, request);
  return request;
}

export function useCurrentUser(): Author | null {
  const host = useHost();
  const [user, setUser] = useState<Author | null>(() => usersByHost.get(host) ?? null);

  useEffect(() => {
    let cancelled = false;
    const cached = usersByHost.get(host);
    if (cached) {
      setUser(cached);
      return undefined;
    }
    loadCurrentUser(host).then(loaded => {
      if (!cancelled) {
        setUser(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [host]);

  return user;
}
