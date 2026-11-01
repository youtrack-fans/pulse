import React from 'react';
import {render, screen} from '@testing-library/react';
import {Suspense} from 'react';
import {describe, expect, it} from 'vitest';

import {HostProvider} from '../../api/host-context';
import {blog, post} from '../../test/fake-host';
import {createBlogHost, createConfig} from '../../test/blog-host';
import {NavigationProvider} from '../../routing/navigation';
import {createNavigationSpy} from '../../test/render-with-app';
import {LazyPostPage, loadPostPage} from './lazy-post-page';

const general = blog('b1', 'General', 1);
const article = post('p1', general, 10, {summary: 'Readable article', content: 'Body of the article', reporterLogin: 'ann'});
const host = createBlogHost({blogs: [general], posts: [article]}).host;
const config = createConfig();

function renderLazy() {
  return render(
    <HostProvider value={host}>
      <NavigationProvider value={createNavigationSpy()}>
        <Suspense fallback={<div>chunk fallback</div>}>
          <LazyPostPage postId="p1" config={config}/>
        </Suspense>
      </NavigationProvider>
    </HostProvider>,
  );
}

describe('LazyPostPage', () => {
  it('shows the Suspense fallback while the chunk is loading and the article once it is there', async () => {
    renderLazy();
    expect(screen.getByText('chunk fallback')).toBeTruthy();
    expect(await screen.findByRole('heading', {name: 'Readable article'})).toBeTruthy();
  });

  it('renders the article instead of an empty page once the chunk is already loaded', async () => {
    await loadPostPage();
    renderLazy();
    expect(screen.queryByText('chunk fallback')).toBeNull();
    expect(await screen.findByRole('heading', {name: 'Readable article'})).toBeTruthy();
  });
});
