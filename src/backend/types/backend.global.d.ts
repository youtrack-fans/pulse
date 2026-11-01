import {Project, Issue, User, Article} from '@/api/youtrack-types';
import {ExtendedProperties} from '@/api/extended-entities';

type ExtendedIssue = ExtendedProperties['Issue'] extends never ? Issue : ExtendedProperties['Issue'];
type ExtendedProject = ExtendedProperties['Project'] extends never ? Project : ExtendedProperties['Project'];
type ExtendedArticle = ExtendedProperties['Article'] extends never ? Article : ExtendedProperties['Article'];
type ExtendedUser = ExtendedProperties['User'] extends never ? User : ExtendedProperties['User'];
type AppGlobalStorageExtensionProperties = ExtendedProperties['AppGlobalStorage'] extends never ? Record<string, unknown> : ExtendedProperties['AppGlobalStorage'];

type HttpResponse<R = unknown> = {
  body: string | null;
  bodyAsStream: unknown | null;
  code: number;
  json: (object: R) => void;
  text: (string: string) => HttpResponse<R>;
  addHeader: (header: string, value: string | null) => HttpResponse<R>;
  status?: number;
};

type HttpRequest<TBody = unknown, Q = Record<string, unknown>> = {
  body: string;
  bodyAsStream: unknown;
  headers: Array<{name: string; value: string}>;
  path: string;
  fullPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parameterNames: Array<string>;
  json: () => TBody;
  getParameter: (name: string) => string | undefined;
  getParameters: (name: string) => Array<string>;
  query: Q;
};

type HttpHandlerScope = 'issue' | 'project' | 'article' | 'user' | 'global';

declare global {
  type Ctx = {
    currentUser: User;
    settings: AppSettings;
  } & (
    | {
        scope: 'issue';
        issue: ExtendedIssue;
        project: ExtendedProject;
      }
    | {
        scope: 'project';
        project: ExtendedProject;
      }
    | {
        scope: 'article';
        article: ExtendedArticle;
      }
    | {
        scope: 'user';
        user: ExtendedUser;
      }
    | {
        scope: 'global';
        globalStorage: {
          extensionProperties: AppGlobalStorageExtensionProperties;
        };
      }
  );

  type CtxPost<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, {scope: S}> & {
    request: HttpRequest<TBody, Q>;
    response: HttpResponse<R>;
  };

  type CtxPut<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, {scope: S}> & {
    request: HttpRequest<TBody, Q>;
    response: HttpResponse<R>;
  };

  type CtxGet<
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, {scope: S}> & {
    request: HttpRequest<never, Q>;
    response: HttpResponse<R>;
  };

  type CtxDelete<
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, {scope: S}> & {
    request: HttpRequest<never, Q>;
    response: HttpResponse<R>;
  };
}

export {};
