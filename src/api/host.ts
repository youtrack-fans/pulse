import type {RequestParams} from '@jetbrains/ring-ui-built/components/http/http';

export interface AppLocation {
  pathname: string;
  search: string;
  hash: string;
}

export interface AppNavigation {
  getAppLocation: () => Promise<AppLocation>;
  updateAppLocation: (location: Partial<AppLocation>) => Promise<void>;
  replaceAppLocation: (location: Partial<AppLocation>) => Promise<void>;
}

export interface HostAPI {
  fetchYouTrack: <T = unknown>(relativeURL: string, requestParams?: RequestParams) => Promise<T>;
  fetchApp: <T = unknown>(relativeURL: string, requestParams?: RequestParams & {scope?: boolean}) => Promise<T>;
  navigation?: AppNavigation;
}
