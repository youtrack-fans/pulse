import {isFresh} from '../../lib/freshness';
import type {HostAPI} from '../../api/host';
import type {Blog, MagazinePostStub} from '../types';
import {fetchAllPages} from '../fetch-all-pages';
import {toPostStub} from './blog-post';

interface YTIndexArticle {
  id: string;
  idReadable: string;
  summary: string;
  created: number;
  reporter: {login: string} | null;
  parentArticle: {id: string} | null;
  comments: readonly {id: string}[] | null;
}

export interface ProjectIndex {
  blogs: readonly Blog[];
  stubs: readonly MagazinePostStub[];
}

const INDEX_FIELDS = 'id,idReadable,summary,created,reporter(login),parentArticle(id),comments(id)';

const inFlight = new Map<string, Promise<ProjectIndex>>();
const latest = new Map<string, {index: ProjectIndex; at: number}>();
const listeners = new Set<(projectShortName: string, index: ProjectIndex) => void>();

export function subscribeProjectIndex(listener: (projectShortName: string, index: ProjectIndex) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function buildIndex(articles: readonly YTIndexArticle[]): ProjectIndex {
  const blogRoots = articles.filter(article => !article.parentArticle);
  const childCount = new Map<string, number>();
  const stubs: MagazinePostStub[] = [];
  const blogIds = new Set(blogRoots.map(root => root.id));

  articles.forEach(article => {
    const parentId = article.parentArticle?.id;
    if (!parentId || !blogIds.has(parentId)) {
      return;
    }
    childCount.set(parentId, (childCount.get(parentId) ?? 0) + 1);
    stubs.push(toPostStub(article, parentId));
  });

  return {
    blogs: blogRoots.map(root => ({
      id: root.id,
      idReadable: root.idReadable,
      summary: root.summary,
      childCount: childCount.get(root.id) ?? 0,
    })),
    stubs: stubs.sort((a, b) => b.created - a.created),
  };
}

function fetchAllArticles(host: HostAPI, projectShortName: string): Promise<readonly YTIndexArticle[]> {
  return fetchAllPages<YTIndexArticle>(
    host,
    `articles?fields=${INDEX_FIELDS}&query=project:+${encodeURIComponent(`{${projectShortName}}`)}`
  );
}

export function peekProjectIndex(projectShortName: string): ProjectIndex | null {
  return latest.get(projectShortName)?.index ?? null;
}

export function loadProjectIndex(host: HostAPI, projectShortName: string, fresh = false): Promise<ProjectIndex> {
  const pending = inFlight.get(projectShortName);
  if (pending) {
    return pending;
  }
  const recent = latest.get(projectShortName);
  if (!fresh && recent && isFresh(recent.at)) {
    return Promise.resolve(recent.index);
  }
  const request = fetchAllArticles(host, projectShortName)
    .then(articles => {
      const index = buildIndex(articles);
      latest.set(projectShortName, {index, at: Date.now()});
      listeners.forEach(listener => listener(projectShortName, index));
      return index;
    })
    .finally(() => {
      inFlight.delete(projectShortName);
    });
  inFlight.set(projectShortName, request);
  return request;
}
