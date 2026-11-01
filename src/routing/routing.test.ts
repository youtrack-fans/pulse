import {describe, expect, it} from 'vitest';

import {locationToRoute, routeIdentity, routeToLocation, serializeLocation, slugify, type Route} from './routing';

function at(pathname: string, search = '') {
  return {pathname, search, hash: ''};
}

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('Onboarding Month: What We Learned!')).toBe('onboarding-month-what-we-learned');
  });

  it('cuts long titles without a trailing dash', () => {
    const slug = slugify(`${'word '.repeat(30)}end`);

    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('returns an empty string for titles without latin letters', () => {
    expect(slugify('Привет')).toBe('');
  });
});

describe('locationToRoute', () => {
  it('opens the blog list for an empty location', () => {
    expect(locationToRoute(at(''))).toEqual({name: 'blog-list', authorLogin: undefined});
  });

  it('opens a feed by blog id', () => {
    expect(locationToRoute(at('feed/184-1'))).toEqual({name: 'feed', blogId: '184-1'});
  });

  it('takes the post id from the tail of a slugged segment', () => {
    expect(locationToRoute(at('post/some-title-184-691', 'reply=1-2&comment=3-4'))).toEqual({
      name: 'post',
      postId: '184-691',
      replyToCommentId: '1-2',
      focusCommentId: '3-4',
    });
  });

  it('takes the rubric id from the tail and keeps the author filter', () => {
    expect(locationToRoute(at('rubric/general-184-1', 'author=ad'))).toEqual({
      name: 'blog-list',
      rubricId: '184-1',
      authorLogin: 'ad',
    });
  });

  it('falls back to the blog list for unknown screens', () => {
    expect(locationToRoute(at('settings/1'))).toEqual({name: 'blog-list', authorLogin: undefined});
  });

  it('does not throw on a malformed percent escape', () => {
    expect(() => locationToRoute(at('post/%'))).not.toThrow();
    expect(() => locationToRoute(at('rubric/%E0%A4%A'))).not.toThrow();
  });

  it('keeps the raw segment as the post id when it cannot be decoded', () => {
    expect(locationToRoute(at('post/%'))).toMatchObject({name: 'post', postId: '%'});
  });
});

describe('routeToLocation', () => {
  const routes: Route[] = [
    {name: 'blog-list'},
    {name: 'blog-list', authorLogin: 'ad'},
    {name: 'blog-list', rubricId: '184-1'},
    {name: 'feed', blogId: '184-1'},
    {name: 'post', postId: '184-691'},
    {name: 'post', postId: '184-691', replyToCommentId: '1-2', focusCommentId: '3-4'},
  ];

  it.each(routes)('round-trips %j', route => {
    const back = locationToRoute(routeToLocation(route));

    expect(back).toMatchObject(route);
  });

  it('puts the slug in front of the id in the pathname', () => {
    expect(routeToLocation({name: 'post', postId: '184-691', slug: 'some-title'}).pathname).toBe('post/some-title-184-691');
    expect(routeToLocation({name: 'blog-list', rubricId: '184-1', rubricSlug: 'general'}).pathname).toBe('rubric/general-184-1');
  });

  it('serializes the search part only when present', () => {
    expect(serializeLocation(at('feed/1'))).toBe('feed/1');
    expect(serializeLocation(at('post/1-2', 'reply=3'))).toBe('post/1-2?reply=3');
  });
});

describe('routeIdentity', () => {
  it('ignores the slug, so a deep link and a click on the same list match', () => {
    expect(routeIdentity({name: 'blog-list', rubricId: '184-1', rubricSlug: 'general'})).toBe(routeIdentity({name: 'blog-list', rubricId: '184-1'}));
  });

  it('tells lists, feeds and posts apart', () => {
    const identities = [
      routeIdentity({name: 'blog-list'}),
      routeIdentity({name: 'blog-list', rubricId: '184-1'}),
      routeIdentity({name: 'blog-list', authorLogin: 'ad'}),
      routeIdentity({name: 'feed', blogId: '184-1'}),
      routeIdentity({name: 'post', postId: '184-2'}),
      routeIdentity({name: 'post', postId: '184-2', focusCommentId: '3'}),
    ];

    expect(new Set(identities).size).toBe(identities.length);
  });
});

describe('comments of a post', () => {
  it('reads the comments marker from the search part', () => {
    expect(locationToRoute(at('post/my-title-5-7', 'comments=1'))).toMatchObject({name: 'post', postId: '5-7', comments: true});
  });

  it('has no comments marker without the search parameter', () => {
    expect(locationToRoute(at('post/my-title-5-7')).name === 'post' && (locationToRoute(at('post/my-title-5-7')) as {comments?: boolean}).comments).toBeFalsy();
  });

  it('writes the marker and reads it back', () => {
    const route: Route = {name: 'post', postId: '5-7', slug: 'my-title', comments: true};
    const location = routeToLocation(route);
    expect(location).toEqual({pathname: 'post/my-title-5-7', search: 'comments=1', hash: ''});
    expect(locationToRoute(location)).toMatchObject({name: 'post', postId: '5-7', comments: true});
  });

  it('tells a post opened at its comments apart from the same post opened at the top', () => {
    expect(routeIdentity({name: 'post', postId: '5-7', comments: true})).not.toBe(routeIdentity({name: 'post', postId: '5-7'}));
  });
});
