export type ExtractRPCFromHandler<T> = T extends (
  ctx: CtxPost<infer Body, infer Res, infer Query, string> | CtxPut<infer Body, infer Res, infer Query, string>
) => void
  ? (body: Body, query?: Partial<Query>) => Promise<Res>
  : T extends (ctx: CtxGet<infer Res, infer Query, string> | CtxDelete<infer Res, infer Query, string>) => void
    ? (query?: Partial<Query>) => Promise<Res>
    : never;
