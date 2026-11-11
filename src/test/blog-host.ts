import type {HostAPI} from '../api/host';
import type {BlogConfig} from '../data/types';
import type {FakeArticle, FakeHost} from './fake-host';
import {createFakeHost, sliceByParams, toApiArticle} from './fake-host';

export interface BlogFixture {
  blogs: readonly FakeArticle[];
  posts: readonly FakeArticle[];
  failArticles?: boolean;
  failChildren?: boolean;
}

let projectCounter = 0;

export function nextProject(): string {
  projectCounter += 1;
  return `DOM${projectCounter}`;
}

export function createConfig(projectShortName: string = nextProject()): BlogConfig {
  return {projectName: 'Pulse', projectShortName, blogName: 'Pulse', contextPath: ''};
}

export function createBlogHost(fixture: BlogFixture): FakeHost {
  const everything = [...fixture.blogs, ...fixture.posts];
  return createFakeHost((route, params) => {
    if (route === 'users/me') {
      return {login: 'tester', fullName: 'Tester', avatarUrl: '', ringId: ''};
    }
    if (route.startsWith('users/')) {
      return {login: route.slice('users/'.length), fullName: 'Someone', avatarUrl: '', ringId: ''};
    }
    const childrenMatch = route.match(/^articles\/([^/]+)\/childArticles$/);
    if (childrenMatch) {
      if (fixture.failChildren) {
        throw new Error('children request failed');
      }
      const children = fixture.posts
        .filter(candidate => candidate.parent?.id === childrenMatch[1])
        .sort((a, b) => a.created - b.created);
      return sliceByParams(children, params).map(toApiArticle);
    }
    const articleMatch = route.match(/^articles\/([^/]+)$/);
    if (articleMatch) {
      if (fixture.failArticles) {
        throw new Error('article request failed');
      }
      const found = everything.find(candidate => candidate.id === articleMatch[1] || candidate.idReadable === articleMatch[1]);
      if (!found) {
        throw Object.assign(new Error('article not found'), {status: 404});
      }
      return params.get('fields') === 'idReadable' ? {idReadable: found.idReadable} : toApiArticle(found);
    }
    if (route === 'articles') {
      const query = params.get('query') ?? '';
      if (query.includes('has: star')) {
        return [];
      }
      if (fixture.failArticles) {
        throw new Error('articles request failed');
      }
      const idsMatch = query.match(/article id: (.+)$/);
      if (idsMatch) {
        const wanted = idsMatch[1].split(',').map(id => id.trim());
        return everything.filter(candidate => wanted.includes(candidate.idReadable)).map(toApiArticle);
      }
      const ordered = query.includes('sort by: created desc')
        ? [...everything].sort((a, b) => b.created - a.created)
        : everything;
      return sliceByParams(ordered, params).map(toApiArticle);
    }
    return [];
  });
}

export function asHost(fake: FakeHost): HostAPI {
  return fake.host;
}
