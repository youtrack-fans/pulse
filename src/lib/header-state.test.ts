import {describe, expect, it, vi} from 'vitest';

import type {Blog, MagazinePostStub} from '../data/types';
import {buildHeaderState} from './header-state';

const blogs: Blog[] = [
  {id: 'b1', idReadable: 'P-A-1', summary: 'General', childCount: 5},
  {id: 'b2', idReadable: 'P-A-2', summary: 'Kotlin', childCount: 3},
  {id: 'b3', idReadable: 'P-A-3', summary: 'Empty', childCount: 0},
];

const stubs: MagazinePostStub[] = [
  {id: 'p1', idReadable: 'P-A-10', created: 10, blogId: 'b2', authorLogin: 'ad', summary: 'Post', commentsCount: 0},
];

function navigation() {
  return {goToFeed: vi.fn(), goToBlogList: vi.fn()};
}

function activeLabels(nav: ReturnType<typeof buildHeaderState>['nav']): string[] {
  return (nav ?? []).filter(item => item.active).map(item => item.label);
}

describe('buildHeaderState', () => {
  it('returns nothing while there are no blogs', () => {
    expect(buildHeaderState({name: 'blog-list'}, [], [], navigation())).toEqual({});
  });

  it('marks All as active in the magazine, also with an author filter, and writes to the first blog', () => {
    const plain = buildHeaderState({name: 'blog-list'}, blogs, stubs, navigation());
    const filtered = buildHeaderState({name: 'blog-list', authorLogin: 'ad'}, blogs, stubs, navigation());

    expect(activeLabels(plain.nav)).toEqual(['All']);
    expect(activeLabels(filtered.nav)).toEqual(['All']);
    expect(plain.writeHref).toBe('/articles/n?parentArticleId=P-A-1');
  });

  it('marks the category of the magazine filter and writes to it', () => {
    const state = buildHeaderState({name: 'blog-list', rubricId: 'b2'}, blogs, stubs, navigation());

    expect(activeLabels(state.nav)).toEqual(['Kotlin']);
    expect(state.writeHref).toBe('/articles/n?parentArticleId=P-A-2');
  });

  it('filters the magazine when a tab is clicked there and opens the feed elsewhere', () => {
    const magazine = navigation();
    const feed = navigation();

    buildHeaderState({name: 'blog-list'}, blogs, stubs, magazine).nav?.[2].onClick();
    buildHeaderState({name: 'feed', blogId: 'b1'}, blogs, stubs, feed).nav?.[2].onClick();

    expect(magazine.goToBlogList).toHaveBeenCalledWith('b2', 'Kotlin');
    expect(feed.goToFeed).toHaveBeenCalledWith('b2');
  });

  it('goes to the magazine from All on every route', () => {
    const feed = navigation();

    buildHeaderState({name: 'feed', blogId: 'b1'}, blogs, stubs, feed).nav?.[0].onClick();

    expect(feed.goToBlogList).toHaveBeenCalledWith();
  });

  it('marks the blog of the feed and writes to it', () => {
    const state = buildHeaderState({name: 'feed', blogId: 'b2'}, blogs, stubs, navigation());

    expect(activeLabels(state.nav)).toEqual(['Kotlin']);
    expect(state.writeHref).toBe('/articles/n?parentArticleId=P-A-2');
  });

  it('takes the blog of a post from its stub', () => {
    const state = buildHeaderState({name: 'post', postId: 'p1'}, blogs, stubs, navigation());

    expect(activeLabels(state.nav)).toEqual(['Kotlin']);
    expect(state.writeHref).toBe('/articles/n?parentArticleId=P-A-2');
  });

  it('shows no active tab and no Write link for a post without a stub', () => {
    const state = buildHeaderState({name: 'post', postId: 'unknown'}, blogs, stubs, navigation());

    expect(activeLabels(state.nav)).toEqual([]);
    expect(state.writeHref).toBeUndefined();
  });

  it('lists every category with posts for the dialog, also when the tabs fit them', () => {
    const state = buildHeaderState({name: 'blog-list'}, blogs, stubs, navigation());

    expect(state.moreNav).toBeUndefined();
    expect(state.allCategories?.map(item => item.label)).toEqual(['General', 'Kotlin']);
  });

  it('keeps categories without posts out of the tabs', () => {
    const state = buildHeaderState({name: 'blog-list'}, blogs, stubs, navigation());

    expect(state.nav?.map(item => item.label)).toEqual(['All', 'General', 'Kotlin']);
  });
});
