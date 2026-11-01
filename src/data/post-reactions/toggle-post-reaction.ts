import type {PostReaction} from '../types';
import type {PostReactionsRepository} from './post-reactions-repository';
import {guarded} from '../../lib/guarded';

const VERIFY_DELAY_MS = 1500;

export type ApplyReactions = (postId: string, reactions: readonly PostReaction[]) => void;

const versions = new Map<string, number>();

function hasReaction(reactions: readonly PostReaction[], id: string | null): boolean {
  return id !== null && reactions.some(reaction => reaction.id === id);
}

function withOwnReaction(
  reactions: readonly PostReaction[],
  own: PostReaction,
  on: boolean,
): readonly PostReaction[] {
  const others = reactions.filter(reaction => reaction.id !== own.id);
  return on ? [...others, own] : others;
}

async function repairReaction(
  repo: PostReactionsRepository,
  postId: string,
  reaction: string,
  on: boolean,
  apply: ApplyReactions,
  isLatest: () => boolean,
): Promise<void> {
  const fresh = (await repo.getReactions([postId]).catch(() => null))?.[postId];
  if (!fresh || !isLatest()) {
    return;
  }
  if (hasReaction(fresh, repo.ownReactionId(reaction)) === on) {
    apply(postId, fresh);
    return;
  }
  if (!isLatest()) {
    return;
  }
  const repaired = await (on ? repo.addReaction(postId, reaction) : repo.removeReaction(postId, reaction)).catch(() => null);
  if (repaired) {
    apply(postId, repaired);
  }
}

function latestOnly(key: string, version: number, apply: ApplyReactions): ApplyReactions {
  return (postId, reactions) => {
    if (versions.get(key) === version) {
      apply(postId, reactions);
    }
  };
}

export async function togglePostReaction(
  repo: PostReactionsRepository,
  postId: string,
  reaction: string,
  on: boolean,
  current: readonly PostReaction[],
  apply: ApplyReactions,
): Promise<boolean> {
  const key = `${postId}:${reaction}`;
  const version = (versions.get(key) ?? 0) + 1;
  versions.set(key, version);
  const applyLatest = latestOnly(key, version, apply);
  const ownLogin = repo.ownLogin();
  const ownId = repo.ownReactionId(reaction);
  if (ownLogin && ownId) {
    applyLatest(postId, withOwnReaction(current, {id: ownId, reaction, authorLogin: ownLogin}, on));
  }
  const updated = await guarded(
    on ? 'add the like' : 'remove the like',
    () => (on ? repo.addReaction(postId, reaction) : repo.removeReaction(postId, reaction)),
  );
  if (!updated) {
    applyLatest(postId, current);
    return false;
  }
  applyLatest(postId, updated);
  setTimeout(() => {
    repairReaction(repo, postId, reaction, on, applyLatest, () => versions.get(key) === version);
  }, VERIFY_DELAY_MS);
  return true;
}
