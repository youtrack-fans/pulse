import type {BlogConfig} from '../types';

export type BlogAccess =
  | {status: 'ready'; config: BlogConfig}
  | {status: 'unconfigured'}
  | {status: 'forbidden'};

export interface ConfigRepository {
  getConfig(): Promise<BlogAccess>;
}
