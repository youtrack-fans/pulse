import type {ReactionsByPost} from './post-reactions-repository';

export function hasReactionsFor(reactions: ReactionsByPost, postIds: readonly string[]): boolean {
  return postIds.every(postId => postId in reactions);
}
