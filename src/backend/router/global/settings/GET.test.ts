import {describe, expect, it} from 'vitest';

import handle, {type SettingsRes} from './GET';

const project = {id: '0-1', name: 'Company Blog', shortName: 'BLOG'};

function run(options: {settings?: unknown; permissions?: readonly string[]}) {
  const responses: Array<{code: number; body: SettingsRes}> = [];
  const response = {
    code: 200,
    json: (body: SettingsRes) => {
      responses.push({code: response.code, body});
    },
  };
  const ctx = {
    currentUser: {login: 'ann', hasPermission: (key: string) => (options.permissions ?? []).includes(key)},
    settings: options.settings ?? {},
    response,
  } as unknown as Parameters<typeof handle>[0];
  handle(ctx);
  return responses[0];
}

describe('GET settings', () => {
  it('reports an unconfigured blog when no project is chosen', () => {
    expect(run({})).toEqual({code: 200, body: {configured: false, project: null}});
  });

  it('hides the project and the blog name from a user who cannot read its articles', () => {
    expect(run({settings: {project, blogName: 'Acme Blog'}, permissions: []})).toEqual({
      code: 200,
      body: {configured: true, project: null},
    });
  });

  it('returns the project, the blog name and the write permissions to a reader', () => {
    expect(run({settings: {project, blogName: 'Acme Blog'}, permissions: ['READ_ARTICLE', 'CREATE_ARTICLE_COMMENT']})).toEqual({
      code: 200,
      body: {
        configured: true,
        project,
        blogName: 'Acme Blog',
        permissions: {createArticle: false, createComment: true},
      },
    });
  });

  it('leaves the blog name out when it is empty', () => {
    expect(run({settings: {project, blogName: ''}, permissions: ['READ_ARTICLE']}).body.blogName).toBeUndefined();
  });

  it('answers 500 when the settings cannot be read', () => {
    const settings = {
      get project(): never {
        throw new Error('storage failed');
      },
    };
    expect(run({settings})).toEqual({
      code: 500,
      body: {configured: false, project: null, error: 'The app settings could not be read.'},
    });
  });
});
