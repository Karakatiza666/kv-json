
export type KVJson = {
   get: <T>(key: string) => Promise<T | null>
   req: <T>(key: string) => Promise<T>
   put: <T>(key: string, value: T) => Promise<void>
}

export type StaticKey<Model, Field extends string> = {
   get: (ctx: {[_ in Field]: KVJson}) => Promise<Model | null>,
   req: (ctx: {[_ in Field]: KVJson}) => Promise<Model>,
   put: (ctx: {[_ in Field]: KVJson}, value: Model) => Promise<void>
}

export type DynamicKey<Model, V, Field extends string> = {
   get: (ctx: {[_ in Field]: KVJson}, key: V) => Promise<Model | null>,
   req: (ctx: {[_ in Field]: KVJson}, key: V) => Promise<Model>,
   put: (ctx: {[_ in Field]: KVJson}, key: V, value: Model) => Promise<void>
}

// const kvAtom = <Model>() => <K>(key: K, ..._: 0[]) => <TT extends 'fuzzy' | 'strict'>(type: TT):
//    K extends string ? {
//       get: (ctx: {[_ in TT]: KVJson}) => Promise<Model>
//    } : {
//       get: <T>(ctx: {[_ in TT]: KVJson}, v: T) => Promise<Model>
//    } => ({
//    })

export const kvAtom = <Model>() => <K, V>(keyPath: K, fs?: (v: V) => string) => <Field extends string>(type: Field):
   K extends string ? StaticKey<Model, Field> : DynamicKey<Model, V, Field> =>
   typeof keyPath === 'string' ? ({
      get(ctx) { return ctx[type].get<Model>(keyPath) },
      req(ctx) { return ctx[type].req<Model>(keyPath) },
      put(ctx, value) { return ctx[type].put<Model>(keyPath, value) }
   } satisfies StaticKey<Model, Field>)
   : Array.isArray(keyPath) && fs ? ({
      get(ctx, key) { return ctx[type].get<Model>(keyPath.join(fs(key))) },
      req(ctx, key) { return ctx[type].req<Model>(keyPath.join(fs(key))) },
      put(ctx, key, value) { return ctx[type].put<Model>(keyPath.join(fs(key)), value) }
   } satisfies DynamicKey<Model, V, Field>)
   : (() => { throw new Error('')}) as any
