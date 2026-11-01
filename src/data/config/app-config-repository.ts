import type {HostAPI} from '../../api/host';
import type {BlogConfig} from '../types';
import type {ConfigRepository} from './config-repository';
import {fetchSettings} from '../../api/index';

export class AppConfigRepository implements ConfigRepository {
  private readonly host: HostAPI;

  constructor(host: HostAPI) {
    this.host = host;
  }

  async getConfig(): Promise<BlogConfig | null> {
    const response = await fetchSettings(this.host);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.project) {
      return null;
    }

    return {
      projectName: response.project.name,
      projectShortName: response.project.shortName,
      blogName: response.blogName,
    };
  }
}
