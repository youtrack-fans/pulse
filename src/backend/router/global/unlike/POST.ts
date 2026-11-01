import {guardBlogRequest} from '../../../guard';
import {findBlogPost, likeItems, readLikes, writeLikes} from '../../../likes';
import {isValidReaction} from '../../../reactions';

/**
 * @zod-to-schema
 */
export type UnlikeReq = {
  postId: string;
  reaction: string;
};

/**
 * @zod-to-schema
 */
export type UnlikeRes = {
  items: {
    postId: string;
    reaction: string;
    authorLogin: string;
  }[];
  me: string;
  error?: string;
};

export default function handle(ctx: CtxPost<UnlikeReq, UnlikeRes>): void {
  const guard = guardBlogRequest(ctx);
  if (!guard) {
    return;
  }
  const {me, project} = guard;
  let postId: unknown;
  let reaction: unknown;
  try {
    ({postId, reaction} = ctx.request.json());
  } catch {
    postId = undefined;
  }
  if (typeof postId !== 'string' || !isValidReaction(reaction)) {
    ctx.response.code = 400;
    ctx.response.json({items: [], me, error: 'postId and reaction are required.'});
    return;
  }
  const article = findBlogPost(project, postId);
  if (!article) {
    ctx.response.code = 404;
    ctx.response.json({items: [], me, error: 'The post was not found in the blog project.'});
    return;
  }
  const likes = readLikes(article);
  const logins = likes[reaction] ?? [];
  if (logins.includes(me)) {
    likes[reaction] = logins.filter(login => login !== me);
    writeLikes(article, likes);
  }
  ctx.response.json({items: likeItems(postId, likes), me});
}

export type Handle = typeof handle;
