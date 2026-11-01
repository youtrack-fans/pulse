import type {PostReaction} from '../types';
import type {ReactionsByPost} from './post-reactions-repository';

export function mergeReactions(previous: ReactionsByPost, loaded: ReactionsByPost, touched: ReadonlySet<string>): ReactionsByPost {
  const merged: Record<string, readonly PostReaction[]> = {...previous, ...loaded};
  touched.forEach(postId => {
    merged[postId] = previous[postId] ?? [];
  });
  return merged;
}
