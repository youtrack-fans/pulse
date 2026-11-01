import type {HostAPI} from '../api/host';

export interface FakeArticle {
  id: string;
  idReadable: string;
  summary: string;
  created: number;
  content?: string;
  reporterLogin?: string;
  parent?: {id: string; summary: string; parentId?: string} | null;
  commentCount?: number;
  commentTexts?: readonly string[];
}

export interface FakeHost {
  host: HostAPI;
  calls: string[];
}

export function createFakeHost(handler: (path: string, params: URLSearchParams) => unknown): FakeHost {
  const calls: string[] = [];
  const host = {
    fetchYouTrack: async (path: string) => {
      calls.push(path);
      const [route, search = ''] = path.split('?');
      return handler(route, new URLSearchParams(search));
    },
    fetchApp: async () => {
      throw new Error('fetchApp is not faked');
    },
  } as unknown as HostAPI;
  return {host, calls};
}

export function sliceByParams<T>(items: readonly T[], params: URLSearchParams): T[] {
  const skip = Number(params.get('$skip') ?? 0);
  const top = Number(params.get('$top') ?? items.length);
  return items.slice(skip, skip + top);
}

export function toApiArticle(article: FakeArticle) {
  return {
    id: article.id,
    idReadable: article.idReadable,
    summary: article.summary,
    content: article.content ?? '',
    created: article.created,
    updated: article.created,
    hasStar: false,
    reporter: {
      login: article.reporterLogin ?? 'author',
      fullName: article.reporterLogin ?? 'author',
      avatarUrl: '',
      ringId: '',
    },
    parentArticle: article.parent
      ? {
        id: article.parent.id,
        idReadable: article.parent.id,
        summary: article.parent.summary,
        parentArticle: article.parent.parentId ? {id: article.parent.parentId} : null,
      }
      : null,
    childArticles: [],
    tags: [],
    attachments: [],
    comments: Array.from({length: article.commentTexts?.length ?? article.commentCount ?? 0}, (_unused, index) => ({
      id: `${article.id}-c${index}`,
      text: article.commentTexts?.[index] ?? 'comment',
      created: article.created,
      author: {login: 'commenter', fullName: 'commenter', avatarUrl: '', ringId: ''},
      reactions: [],
    })),
  };
}

export function createArticlesFake(articles: readonly FakeArticle[]): FakeHost {
  return createFakeHost((route, params) => {
    const contentMatch = route.match(/^articles\/([^/]+)$/);
    if (contentMatch) {
      const found = articles.find(article => article.id === contentMatch[1]);
      return {content: found?.content ?? ''};
    }
    const query = params.get('query') ?? '';
    const ordered = query.includes('sort by: created desc')
      ? [...articles].sort((a, b) => b.created - a.created)
      : [...articles];
    return sliceByParams(ordered, params).map(toApiArticle);
  });
}

export function blog(id: string, summary: string, created: number): FakeArticle {
  return {id, idReadable: `P-A-${id}`, summary, created};
}

export function post(id: string, blogArticle: FakeArticle, created: number, extra: Partial<FakeArticle> = {}): FakeArticle {
  return {
    id,
    idReadable: `P-A-${id}`,
    summary: `Post ${id}`,
    created,
    parent: {id: blogArticle.id, summary: blogArticle.summary},
    ...extra,
  };
}
