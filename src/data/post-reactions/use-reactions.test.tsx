import React from 'react';
import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {HostProvider} from '../../api/host-context';
import {createBlogHost, createConfig} from '../../test/blog-host';
import {AppPostReactionsRepository} from './app-post-reactions-repository';
import {useReactions} from './use-reactions';

function setup() {
  const host = createBlogHost({blogs: [], posts: []}).host;
  const config = createConfig();
  const wrapper = ({children}: {children: React.ReactNode}) => <HostProvider value={host}>{children}</HostProvider>;
  return renderHook(() => useReactions(config, 'reset'), {wrapper});
}

describe('useReactions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the posts loading when the reactions request fails', async () => {
    vi.spyOn(AppPostReactionsRepository.prototype, 'getReactions').mockRejectedValue(new Error('reactions request failed'));
    const {result} = setup();
    await act(async () => {
      await result.current.loadReactions(['p1'], {complete: true, markReady: true});
    });
    expect(result.current.reactionsLoadingFor(['p1'])).toBe(true);
  });

  it('stops loading the posts once the reactions request succeeds', async () => {
    vi.spyOn(AppPostReactionsRepository.prototype, 'getReactions').mockResolvedValue({p1: []});
    const {result} = setup();
    await act(async () => {
      await result.current.loadReactions(['p1'], {complete: true, markReady: true});
    });
    expect(result.current.reactionsLoadingFor(['p1'])).toBe(false);
  });
});
