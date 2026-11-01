/**
 * @zod-to-schema
 */
export type SettingsRes = {
  project: {
    id: string;
    name: string;
    shortName: string;
  } | null;
  blogName?: string;
  error?: string;
};

type SettingsProject = {id: string; name: string; shortName: string};

export default function handle(ctx: CtxGet<SettingsRes>): void {
  try {
    const project = ctx.settings.project as unknown as SettingsProject | undefined;
    ctx.response.json({
      project: project ? {
        id: project.id,
        name: project.name,
        shortName: project.shortName
      } : null,
      blogName: ctx.settings.blogName || undefined
    });
  } catch {
    ctx.response.code = 500;
    ctx.response.json({project: null, error: 'The app settings could not be read.'});
  }
}

export type Handle = typeof handle;
