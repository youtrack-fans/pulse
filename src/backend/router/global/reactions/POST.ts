import {guardBlogRequest} from '../../../guard';
import {findBlogPosts, likeItems, readLikes} from '../../../likes';

/**
 * @zod-to-schema
 */
export type ReactionsReq = {
  postIds: string[];
};

/**
 * @zod-to-schema
 */
export type ReactionsRes = {
  items: {
    postId: string;
    reaction: string;
    authorLogin: string;
  }[];
  me: string;
  error?: string;
};

export default function handle(ctx: CtxPost<ReactionsReq, ReactionsRes>): void {
  const guard = guardBlogRequest(ctx);
  if (!guard) {
    return;
  }
  const {me, project} = guard;
  let postIds: unknown;
  try {
    postIds = ctx.request.json().postIds;
  } catch {
    postIds = undefined;
  }
  if (!Array.isArray(postIds) || postIds.length > 200 || postIds.some(postId => typeof postId !== 'string')) {
    ctx.response.code = 400;
    ctx.response.json({items: [], me, error: 'postIds must be a list of at most 200 ids.'});
    return;
  }
  const items: ReactionsRes['items'] = [];
  findBlogPosts(project, [...new Set<string>(postIds)]).forEach((article, postId) => {
    likeItems(postId, readLikes(article)).forEach(item => items.push(item));
  });
  ctx.response.json({items, me});
}

export type Handle = typeof handle;
