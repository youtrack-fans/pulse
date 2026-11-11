import type {Project} from '@jetbrains/youtrack-scripting-api/entities';

/**
 * @zod-to-schema
 */
export type SettingsRes = {
  configured: boolean;
  project: {
    id: string;
    name: string;
    shortName: string;
  } | null;
  blogName?: string;
  permissions?: {
    createArticle: boolean;
    createComment: boolean;
  };
  error?: string;
};

type SettingsProject = {id: string; name: string; shortName: string};

export default function handle(ctx: CtxGet<SettingsRes>): void {
  try {
    const project = ctx.settings.project as unknown as SettingsProject | undefined;
    if (!project) {
      ctx.response.json({configured: false, project: null});
      return;
    }
    const scope = project as unknown as Project;
    const user = ctx.currentUser;
    if (!user.hasPermission('READ_ARTICLE', scope)) {
      ctx.response.json({configured: true, project: null});
      return;
    }
    ctx.response.json({
      configured: true,
      project: {
        id: project.id,
        name: project.name,
        shortName: project.shortName
      },
      blogName: ctx.settings.blogName || undefined,
      permissions: {
        createArticle: user.hasPermission('CREATE_ARTICLE', scope),
        createComment: user.hasPermission('CREATE_ARTICLE_COMMENT', scope)
      }
    });
  } catch {
    ctx.response.code = 500;
    ctx.response.json({configured: false, project: null, error: 'The app settings could not be read.'});
  }
}

export type Handle = typeof handle;
