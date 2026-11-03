import type {Blog, MagazinePostStub} from '../data/types';
import type {PulseNavItem} from './nav-item';
import type {Route} from '../routing/routing';
import {buildNav} from './build-nav';

export interface HeaderNavigation {
  goToFeed: (blogId: string) => void;
  goToBlogList: (rubricId?: string, rubricName?: string) => void;
}

export interface HeaderState {
  nav?: readonly PulseNavItem[];
  moreNav?: readonly PulseNavItem[];
  allCategories?: readonly PulseNavItem[];
  writeHref?: string;
}

function findActiveBlogId(route: Route, stubs: readonly MagazinePostStub[]): string | null {
  switch (route.name) {
    case 'feed':
      return route.blogId;
    case 'post':
      return stubs.find(stub => stub.id === route.postId)?.blogId ?? null;
    default:
      return route.rubricId ?? null;
  }
}

export function buildHeaderState(
  route: Route,
  blogs: readonly Blog[],
  stubs: readonly MagazinePostStub[],
  navigation: HeaderNavigation,
  contextPath: string,
): HeaderState {
  if (blogs.length === 0) {
    return {};
  }
  const activeBlogId = findActiveBlogId(route, stubs);
  const onAll = () => navigation.goToBlogList();
  const onSelect = route.name === 'blog-list'
    ? (blog: Blog) => navigation.goToBlogList(blog.id, blog.summary)
    : (blog: Blog) => navigation.goToFeed(blog.id);
  const {nav, categories, allCategories} = buildNav(blogs, activeBlogId, route.name === 'blog-list' && activeBlogId === null, onAll, onSelect);
  const activeBlog = blogs.find(blog => blog.id === activeBlogId);
  const target = route.name === 'blog-list' ? activeBlog ?? blogs[0] : activeBlog;
  return {
    nav,
    moreNav: categories,
    allCategories,
    writeHref: target ? `${contextPath}/articles/n?parentArticleId=${target.idReadable}` : undefined,
  };
}
