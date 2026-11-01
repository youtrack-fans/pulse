import type {MagazinePostStub, PostSummary} from '../types';

export function toPostSummaries(stubs: readonly MagazinePostStub[], blogId: string): readonly PostSummary[] {
  return stubs
    .filter(stub => stub.blogId === blogId)
    .map(stub => ({id: stub.id, summary: stub.summary, commentsCount: stub.commentsCount}));
}
