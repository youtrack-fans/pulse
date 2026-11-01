import {useEffect, useState} from 'react';

import type {Blog, BlogConfig, MagazinePostStub} from '../types';
import {useHost} from '../../api/host-context';
import {loadProjectIndex, peekProjectIndex, subscribeProjectIndex} from './project-index';

interface BlogsData {
  blogs: readonly Blog[];
  stubs: readonly MagazinePostStub[];
  loading: boolean;
  error: boolean;
}

export interface BlogsState extends BlogsData {
  retry: () => void;
}

export function useBlogs(config: BlogConfig): BlogsState {
  const host = useHost();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<BlogsData>(() => {
    const cached = peekProjectIndex(config.projectShortName);
    return cached
      ? {blogs: cached.blogs, stubs: cached.stubs, loading: false, error: false}
      : {blogs: [], stubs: [], loading: true, error: false};
  });

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeProjectIndex((projectShortName, index) => {
      if (!cancelled && projectShortName === config.projectShortName) {
        setState({blogs: index.blogs, stubs: index.stubs, loading: false, error: false});
      }
    });
    loadProjectIndex(host, config.projectShortName)
      .then(index => {
        if (!cancelled) {
          setState({blogs: index.blogs, stubs: index.stubs, loading: false, error: false});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(previous => ({...previous, loading: false, error: true}));
        }
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [host, config.projectShortName, attempt]);

  const retry = () => {
    setState(previous => ({...previous, loading: true, error: false}));
    setAttempt(count => count + 1);
  };

  return {...state, retry};
}
