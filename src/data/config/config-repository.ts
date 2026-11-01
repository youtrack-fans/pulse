import type {BlogConfig} from '../types';

export interface ConfigRepository {
  getConfig(): Promise<BlogConfig | null>;
}
