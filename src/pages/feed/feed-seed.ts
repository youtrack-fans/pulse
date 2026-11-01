import type {BlogPost, PostSummary} from '../../data/types';
import {peekProjectIndex} from '../../data/articles/project-index';
import {peekPost} from '../../data/articles/post-cache';
import {toPostSummaries} from '../../data/articles/post-summary';

export interface FeedSeed {
  summary: readonly PostSummary[];
  posts: readonly BlogPost[] | null;
}

export function readFeedSeed(projectShortName: string, blogId: string, firstPageSize: number): FeedSeed | null {
  const index = peekProjectIndex(projectShortName);
  if (!index) {
    return null;
  }
  const summary = toPostSummaries(index.stubs, blogId);
  const cached = summary.slice(0, firstPageSize).map(item => peekPost(item.id));
  return {summary, posts: cached.every((post): post is BlogPost => post !== null) ? cached : null};
}

export function mergeFirstPage(
  previous: readonly BlogPost[],
  firstPage: readonly BlogPost[],
  knownIds: ReadonlySet<string>,
): readonly BlogPost[] {
  const firstIds = new Set(firstPage.map(post => post.id));
  const tail = previous.filter(post => !firstIds.has(post.id) && knownIds.has(post.id));
  return [...firstPage, ...tail];
}
