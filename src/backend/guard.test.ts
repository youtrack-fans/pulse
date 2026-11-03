import {describe, expect, it} from 'vitest';

import {guardBlogRequest, guardLikeRequest, type GuardContext} from './guard';

const project = {key: 'BLOG'};

function createContext(options: {project?: unknown; canRead: boolean; login?: string}) {
  const responses: Array<{code: number; body: unknown}> = [];
  const response = {
    code: 200,
    json: (body: unknown) => {
      responses.push({code: response.code, body});
    },
  };
  const ctx: GuardContext = {
    currentUser: {login: options.login ?? 'ann', hasPermission: () => options.canRead},
    settings: {project: options.project},
    response,
  };
  return {ctx, responses};
}

describe('guardBlogRequest', () => {
  it('answers 400 when the blog project is not configured', () => {
    const {ctx, responses} = createContext({canRead: true});
    expect(guardBlogRequest(ctx)).toBeNull();
    expect(responses).toEqual([{code: 400, body: {items: [], me: 'ann', error: 'The blog project is not configured.'}}]);
  });

  it('answers 403 when the user cannot read articles of the project', () => {
    const {ctx, responses} = createContext({project, canRead: false});
    expect(guardBlogRequest(ctx)).toBeNull();
    expect(responses[0].code).toBe(403);
  });

  it('returns the login and the project and writes no response for a reader', () => {
    const {ctx, responses} = createContext({project, canRead: true});
    expect(guardBlogRequest(ctx)).toEqual({me: 'ann', project});
    expect(responses).toEqual([]);
  });
});

describe('guardLikeRequest', () => {
  it('answers 403 to a guest even when guests can read the project', () => {
    const {ctx, responses} = createContext({project, canRead: true, login: 'guest'});
    expect(guardLikeRequest(ctx)).toBeNull();
    expect(responses).toEqual([{code: 403, body: {items: [], me: 'guest', error: 'Sign in to like posts.'}}]);
  });

  it('lets a signed-in reader through', () => {
    const {ctx, responses} = createContext({project, canRead: true});
    expect(guardLikeRequest(ctx)).toEqual({me: 'ann', project});
    expect(responses).toEqual([]);
  });
});
