import type {HostAPI} from '../../api/host';
import type {BlogConfig, PostReaction} from '../types';
import type {PostReactionsRepository, ReactionsByPost} from './post-reactions-repository';
import {createApi} from '../../api/index';
import {loadProjectIndex} from '../articles/project-index';
import type {ReactionsRes} from '@backend/router/global/reactions/POST';

type ReactionItem = ReactionsRes['items'][number];

const BATCH_SIZE = 200;

const reactionsByProject = new Map<string, ReactionsByPost>();
const loadedProjects = new Set<string>();
const currentLoginByProject = new Map<string, string>();
const listeners = new Set<(projectShortName: string, loaded: ReactionsByPost) => void>();

export function subscribeReactions(listener: (projectShortName: string, loaded: ReactionsByPost) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reactionId(authorLogin: string, reaction: string): string {
  return `${authorLogin}:${reaction}`;
}

function toReaction(item: ReactionItem): PostReaction {
  return {id: reactionId(item.authorLogin, item.reaction), reaction: item.reaction, authorLogin: item.authorLogin};
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export class AppPostReactionsRepository implements PostReactionsRepository {
  private readonly host: HostAPI;
  private readonly config: BlogConfig;

  constructor(host: HostAPI, config: BlogConfig) {
    this.host = host;
    this.config = config;
  }

  getCachedReactions(): ReactionsByPost | null {
    return reactionsByProject.get(this.config.projectShortName) ?? null;
  }

  hasLoadedReactions(): boolean {
    return loadedProjects.has(this.config.projectShortName);
  }

  ownLogin(): string | null {
    return currentLoginByProject.get(this.config.projectShortName) ?? null;
  }

  ownReactionId(reaction: string): string | null {
    const login = this.ownLogin();
    return login ? reactionId(login, reaction) : null;
  }

  async getReactions(postIds: readonly string[], complete = false): Promise<ReactionsByPost> {
    if (postIds.length === 0) {
      return {};
    }
    const readableById = await this.readableIds(postIds);
    const idByReadable = new Map([...readableById].map(([id, readable]) => [readable, id]));
    const loaded: Record<string, PostReaction[]> = {};
    postIds.forEach(postId => {
      loaded[postId] = [];
    });
    const postReactions = createApi(this.host).global.reactions.POST;
    const responses = await Promise.all(chunk([...idByReadable.keys()], BATCH_SIZE).map(ids => postReactions({postIds: ids})));
    responses.forEach(response => {
      this.rememberLogin(response.me);
      response.items.forEach(item => {
        const postId = idByReadable.get(item.postId);
        if (postId) {
          loaded[postId].push(toReaction(item));
        }
      });
    });
    const stored = this.store(loaded);
    if (complete) {
      loadedProjects.add(this.config.projectShortName);
    }
    return stored;
  }

  async addReaction(postId: string, reaction: string): Promise<readonly PostReaction[]> {
    const like = createApi(this.host).global.like.POST;
    const response = await like({postId: await this.readableId(postId), reaction});
    this.rememberLogin(response.me);
    return this.store({[postId]: response.items.map(toReaction)})[postId];
  }

  async removeReaction(postId: string, reaction: string): Promise<readonly PostReaction[]> {
    const unlike = createApi(this.host).global.unlike.POST;
    const response = await unlike({postId: await this.readableId(postId), reaction});
    this.rememberLogin(response.me);
    return this.store({[postId]: response.items.map(toReaction)})[postId];
  }

  private rememberLogin(login: string): void {
    if (login) {
      currentLoginByProject.set(this.config.projectShortName, login);
    }
  }

  private store(loaded: Readonly<Record<string, readonly PostReaction[]>>): ReactionsByPost {
    const key = this.config.projectShortName;
    reactionsByProject.set(key, {...(reactionsByProject.get(key) ?? {}), ...loaded});
    listeners.forEach(listener => listener(key, loaded));
    return loaded;
  }

  private async readableId(postId: string): Promise<string> {
    const readable = (await this.readableIds([postId])).get(postId);
    if (!readable) {
      throw new Error(`Post ${postId} was not found.`);
    }
    return readable;
  }

  private async readableIds(postIds: readonly string[]): Promise<Map<string, string>> {
    const index = await loadProjectIndex(this.host, this.config.projectShortName);
    const result = new Map<string, string>();
    const missing: string[] = [];
    const readableByStubId = new Map(index.stubs.map(stub => [stub.id, stub.idReadable]));
    postIds.forEach(postId => {
      const readable = readableByStubId.get(postId);
      if (readable) {
        result.set(postId, readable);
      } else {
        missing.push(postId);
      }
    });
    const fetched = await Promise.all(missing.map(postId =>
      this.host.fetchYouTrack<{idReadable: string}>(`articles/${postId}?fields=idReadable`)
        .then(article => [postId, article.idReadable] as const)
        .catch(() => null)));
    fetched.forEach(entry => {
      if (entry) {
        result.set(entry[0], entry[1]);
      }
    });
    return result;
  }
}
