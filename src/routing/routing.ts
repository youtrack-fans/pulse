import type {AppLocation} from '../api/host';
import {safeDecodeURIComponent} from '../lib/utils';

export type Route =
  | {name: 'blog-list'; rubricId?: string; rubricSlug?: string; authorLogin?: string}
  | {name: 'feed'; blogId: string}
  | {name: 'post'; postId: string; replyToCommentId?: string; focusCommentId?: string; comments?: boolean; slug?: string};

export function routeIdentity(route: Route): string {
  switch (route.name) {
    case 'feed':
      return `feed:${route.blogId}`;
    case 'post':
      return `post:${route.postId}:${route.replyToCommentId ?? ''}:${route.focusCommentId ?? ''}:${route.comments ? 'comments' : ''}`;
    default:
      return `list:${route.rubricId ?? ''}:${route.authorLogin ?? ''}`;
  }
}

const EMPTY_LOCATION: AppLocation = {pathname: '', search: '', hash: ''};
const SLUG_MAX_LENGTH = 60;
const ID_TAIL_PATTERN = /(\d+-\d+)$/;

function segment(value: string): string {
  return encodeURIComponent(value);
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
}

function withSearch(pathname: string, params: URLSearchParams): AppLocation {
  return {pathname, search: params.toString(), hash: ''};
}

function feedLocation(route: Extract<Route, {name: 'feed'}>): AppLocation {
  return {pathname: `feed/${segment(route.blogId)}`, search: '', hash: ''};
}

function postLocation(route: Extract<Route, {name: 'post'}>): AppLocation {
  const params = new URLSearchParams();
  if (route.replyToCommentId) {
    params.set('reply', route.replyToCommentId);
  }
  if (route.focusCommentId) {
    params.set('comment', route.focusCommentId);
  }
  if (route.comments) {
    params.set('comments', '1');
  }
  const tail = route.slug ? `${route.slug}-${route.postId}` : segment(route.postId);
  return withSearch(`post/${tail}`, params);
}

function blogListLocation(route: Extract<Route, {name: 'blog-list'}>): AppLocation {
  const params = new URLSearchParams();
  if (route.authorLogin) {
    params.set('author', route.authorLogin);
  }
  if (!route.rubricId) {
    return withSearch('', params);
  }
  const tail = route.rubricSlug ? `${route.rubricSlug}-${route.rubricId}` : segment(route.rubricId);
  return withSearch(`rubric/${tail}`, params);
}

export function routeToLocation(route: Route): AppLocation {
  switch (route.name) {
    case 'feed':
      return feedLocation(route);
    case 'post':
      return postLocation(route);
    case 'blog-list':
      return blogListLocation(route);
    default:
      return EMPTY_LOCATION;
  }
}

function optional(value: string | null): string | undefined {
  return value === null ? undefined : value;
}

function extractTrailingId(value: string): string {
  const match = value.match(ID_TAIL_PATTERN);
  return match ? match[1] : value;
}

export function locationToRoute(location: AppLocation): Route {
  const [screen, first] = location.pathname.split('/').filter(Boolean).map(safeDecodeURIComponent);
  const params = new URLSearchParams(location.search);

  if (first) {
    if (screen === 'feed') {
      return {name: 'feed', blogId: first};
    }
    if (screen === 'post') {
      return {
        name: 'post',
        postId: extractTrailingId(first),
        replyToCommentId: optional(params.get('reply')),
        focusCommentId: optional(params.get('comment')),
        comments: params.has('comments') || undefined,
      };
    }
    if (screen === 'rubric') {
      return {name: 'blog-list', rubricId: extractTrailingId(first), authorLogin: optional(params.get('author'))};
    }
  }

  return {name: 'blog-list', authorLogin: optional(params.get('author'))};
}

export function serializeLocation(location: AppLocation): string {
  return location.search ? `${location.pathname}?${location.search}` : location.pathname;
}
