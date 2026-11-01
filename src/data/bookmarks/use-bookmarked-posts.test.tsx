import React from 'react';
import {renderHook, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {HostProvider} from '../../api/host-context';
import {createBlogHost, createConfig} from '../../test/blog-host';
import {useBookmarkedPosts} from './use-bookmarked-posts';

const STAR_QUERY = 'has%3A%20star';

function setup() {
  const fake = createBlogHost({blogs: [], posts: []});
  const wrapper = ({children}: {children: React.ReactNode}) => <HostProvider value={fake.host}>{children}</HostProvider>;
  const starRequests = () => fake.calls.filter(call => call.includes(STAR_QUERY)).length;
  return {wrapper, starRequests, config: createConfig()};
}

describe('useBookmarkedPosts', () => {
  it('does not request the bookmarks while it is disabled', async () => {
    const {wrapper, starRequests, config} = setup();
    const {result} = renderHook(() => useBookmarkedPosts(config, false), {wrapper});
    await Promise.resolve();
    expect(starRequests()).toBe(0);
    expect(result.current.posts).toBeNull();
  });

  it('requests the bookmarks once it is enabled', async () => {
    const {wrapper, starRequests, config} = setup();
    const {result, rerender} = renderHook(({enabled}) => useBookmarkedPosts(config, enabled), {wrapper, initialProps: {enabled: false}});
    rerender({enabled: true});
    await waitFor(() => expect(result.current.posts).toEqual([]));
    expect(starRequests()).toBe(1);
  });
});
