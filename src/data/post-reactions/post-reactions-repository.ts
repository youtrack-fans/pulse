import type {PostReaction} from '../types';

export type ReactionsByPost = Readonly<Record<string, readonly PostReaction[]>>;

export interface PostReactionsRepository {
  getCachedReactions(): ReactionsByPost | null;
  hasLoadedReactions(): boolean;
  getReactions(postIds: readonly string[], complete?: boolean): Promise<ReactionsByPost>;
  addReaction(postId: string, reaction: string): Promise<readonly PostReaction[]>;
  removeReaction(postId: string, reaction: string): Promise<readonly PostReaction[]>;
  ownLogin(): string | null;
  ownReactionId(reaction: string): string | null;
}
