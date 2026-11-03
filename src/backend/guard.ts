import type {Project} from '@jetbrains/youtrack-scripting-api/entities';
import type {LikeItem} from './likes';

interface GuardResponse {
  items: LikeItem[];
  me: string;
  error?: string;
}

export interface GuardContext {
  currentUser: {
    login: string;
    hasPermission: (permission: string, project: Project) => boolean;
  };
  settings: {project?: unknown};
  response: {
    code: number;
    json: (body: GuardResponse) => void;
  };
}

export interface BlogRequest {
  me: string;
  project: Project;
}

const GUEST_LOGIN = 'guest';

export function guardBlogRequest(ctx: GuardContext): BlogRequest | null {
  const me = ctx.currentUser.login;
  const project = ctx.settings.project as unknown as Project | undefined;
  if (!project) {
    ctx.response.code = 400;
    ctx.response.json({items: [], me, error: 'The blog project is not configured.'});
    return null;
  }
  if (!ctx.currentUser.hasPermission('READ_ARTICLE', project)) {
    ctx.response.code = 403;
    ctx.response.json({items: [], me, error: 'You cannot read articles in the blog project.'});
    return null;
  }
  return {me, project};
}

export function guardLikeRequest(ctx: GuardContext): BlogRequest | null {
  if (ctx.currentUser.login === GUEST_LOGIN) {
    ctx.response.code = 403;
    ctx.response.json({items: [], me: ctx.currentUser.login, error: 'Sign in to like posts.'});
    return null;
  }
  return guardBlogRequest(ctx);
}
