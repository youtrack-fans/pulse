import type {MagazinePostStub} from '../types';

export const PARENT_FIELDS = 'parentArticle(id,idReadable,summary,parentArticle(id))';

interface ParentRef {
  summary: string;
  parentArticle?: {id: string} | null;
}

interface StubArticle {
  id: string;
  idReadable: string;
  summary: string;
  created: number;
  reporter: {login: string} | null;
  comments: readonly {id: string}[] | null;
}

export function isBlogPost(article: {parentArticle: ParentRef | null}): boolean {
  const blog = article.parentArticle;
  return blog !== null && !blog.parentArticle;
}

export function toPostStub(article: StubArticle, blogId: string): MagazinePostStub {
  return {
    id: article.id,
    idReadable: article.idReadable,
    created: article.created,
    blogId,
    authorLogin: article.reporter?.login ?? '',
    summary: article.summary,
    commentsCount: (article.comments ?? []).length,
  };
}
