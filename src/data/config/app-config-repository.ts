import type {HostAPI} from '../../api/host';
import type {BlogAccess, ConfigRepository} from './config-repository';
import {fetchSettings} from '../../api/index';

export class AppConfigRepository implements ConfigRepository {
  private readonly host: HostAPI;

  constructor(host: HostAPI) {
    this.host = host;
  }

  async getConfig(): Promise<BlogAccess> {
    const [response, contextPath] = await Promise.all([fetchSettings(this.host), this.fetchContextPath()]);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.configured) {
      return {status: 'unconfigured'};
    }

    if (!response.project) {
      return {status: 'forbidden'};
    }

    return {
      status: 'ready',
      config: {
        projectName: response.project.name,
        projectShortName: response.project.shortName,
        blogName: response.blogName,
        contextPath,
        canWrite: response.permissions?.createArticle ?? false,
        canComment: response.permissions?.createComment ?? false,
      },
    };
  }

  async getContextPath(): Promise<string> {
    return this.fetchContextPath();
  }

  private async fetchContextPath(): Promise<string> {
    try {
      const config = await this.host.fetchYouTrack<{contextPath?: string}>('config?fields=contextPath');
      return config.contextPath ?? '';
    } catch {
      return '';
    }
  }
}
