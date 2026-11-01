import type {HostAPI} from './host';
import type {ApiRouter} from './api';
import type {SettingsRes} from '@backend/router/global/settings/GET';
import {createApi as createApiBase} from '@jetbrains/youtrack-apps-tools/dx/api';

const appId = 'pulse';

export const registerHost = async (appApi: Parameters<typeof YTApp.register>[0]): Promise<HostAPI> =>
  (await YTApp.register(appApi)) as HostAPI;

type DxHostAPI = Parameters<typeof createApiBase>[0];

export const createApi = (host: HostAPI) =>
  createApiBase<ApiRouter>(host as unknown as DxHostAPI, {
    appId,
    zodImport: import.meta.env.DEV ? () => import('./api.zod') : undefined
  });

export const fetchSettings = (host: HostAPI): Promise<SettingsRes> => {
  const read = createApi(host).global.settings.GET as unknown as () => Promise<SettingsRes>;
  return read();
};
