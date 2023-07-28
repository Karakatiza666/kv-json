// type ZZ = {
//    get: <T>(key: string) => Promise<T | null>
//    req: <T>(key: string) => Promise<T>
//    put: <T>(key: string, value: T) => Promise<void>
// }

// type KVApi<X = unknown> = X extends Uint8Array ? {
//    get: (key: string) => Promise<Uint8Array | null>
//    req: (key: string) => Promise<Uint8Array>
//    put: (key: string, value: Uint8Array) => Promise<void>
// } : {
//    get: <T>(key: string) => Promise<T | null>
//    req: <T>(key: string) => Promise<T>
//    put: <T>(key: string, value: T) => Promise<void>
// }

export type KVJson = // KVApi & { raw: KVApi<Uint8Array> }
{
   get: <T>(key: string) => Promise<T | null>
   req: <T>(key: string) => Promise<T>
   put: <T>(key: string, value: T) => Promise<void>
   raw: {
      get: (key: string) => Promise<Uint8Array | null>
      req: (key: string) => Promise<Uint8Array>
      put: (key: string, value: Uint8Array) => Promise<void>
   }
}

export type StaticKey<Model, Field extends string> = {
   get:     (ctx: {[_ in Field]: KVJson}) => Promise<Model | null>
   req:     (ctx: {[_ in Field]: KVJson}) => Promise<Model>
   put:     (ctx: {[_ in Field]: KVJson}, value: Model) => Promise<void>
} & (Model extends Uint8Array ? {} : { raw: StaticKey<Uint8Array, Field> })

export type DynamicKey<Model, V, Field extends string> = {
   get:     (ctx: {[_ in Field]: KVJson}, key: V) => Promise<Model | null>
   req:     (ctx: {[_ in Field]: KVJson}, key: V) => Promise<Model>
   put:     (ctx: {[_ in Field]: KVJson}, key: V, value: Model) => Promise<void>
} & (Model extends Uint8Array ? {} : { raw: DynamicKey<Uint8Array, V, Field> })

// const kvAtom = <Model>() => <K>(key: K, ..._: 0[]) => <TT extends 'fuzzy' | 'strict'>(type: TT):
//    K extends string ? {
//       get: (ctx: {[_ in TT]: KVJson}) => Promise<Model>
//    } : {
//       get: <T>(ctx: {[_ in TT]: KVJson}, v: T) => Promise<Model>
//    } => ({
//    })

type Migrations = Record<number, (v: any) => any>

export const kvAtom = <Model>() => <K, V>(keyPath: K, fs?: (v: V) => string) =>
   <Field extends string>(type: Field, migrations?: Migrations):
   K extends string ? StaticKey<Model, Field> : DynamicKey<Model, V, Field> => {
   const version = checkMigrations(migrations)
   if (version === null) {
      throw new Error('Inconsistent migrations!')
   }
   const withVersion: (x: any) => any = version === 0 ? (x => x) : (x => ({ [version]: x }))
   return typeof keyPath === 'string' ? ({
         get   (ctx) { return ctx[type].get<Model>(keyPath).then(runMigrations(migrations)) },
         req   (ctx) { return ctx[type].req<Model>(keyPath).then(runMigrations(migrations)) },
         put   (ctx, value) { return ctx[type].put<Model>(keyPath, withVersion(value)) },
         raw: {
            get   (ctx) { return ctx[type].raw.get(keyPath) },
            req   (ctx) { return ctx[type].raw.req(keyPath) },
            put   (ctx, value) { return ctx[type].raw.put(keyPath, value) },
         }
      } satisfies StaticKey<Model, Field>)
      : Array.isArray(keyPath) && fs ? ({
         get   (ctx, key) { return ctx[type].get<Model>(keyPath.join(fs(key))).then(runMigrations(migrations)) },
         req   (ctx, key) { return ctx[type].req<Model>(keyPath.join(fs(key))).then(runMigrations(migrations)) },
         put   (ctx, key, value) { return ctx[type].put<Model>(keyPath.join(fs(key)), withVersion(value)) },
         raw: {
            get(ctx, key) { return ctx[type].raw.get(keyPath.join(fs(key))) },
            req(ctx, key) { return ctx[type].raw.req(keyPath.join(fs(key))) },
            put(ctx, key, value) { return ctx[type].raw.put(keyPath.join(fs(key)), value) }
         }
      } satisfies DynamicKey<Model, V, Field>)
      : (() => { throw new Error('')}) as any
}

/**
 * Check if migration ids are integer and do not have gaps
 * @param migrations 
 */
const checkMigrations = (migrations?: Migrations) => {
   if (!migrations) return 0
   const keys = Object.keys(migrations)
   const ids = keys.filter(/^\d+$/.test).map(parseInt).sort()
   return keys.length === ids.length && ids.every((n, i) => n === ids[0] + i)
      ? ids[ids.length - 1]
      : null
}

const runMigrations = (migrations?: Migrations) => <T>(raw: T): T => {
   if (!migrations) {
      return raw
   }
   if (raw === null) {
      return raw
   }
   // const ids = Object.keys(migrations).map(parseInt).sort()
   // let id = +(!(o instanceof Array) && typeof o === 'object' && o !== null && (ks => ks.length === 1 && parseInt(ks[0]))(Object.keys(o)))
   let [id, obj] = (() => {
      if (raw instanceof Array)
         return [0, raw]
      if (typeof raw !== 'object' || raw === null)
         return [0, raw]
      const key = (ks => ks.length === 1 && parseInt(ks[0]))(Object.keys(raw))
      if (!key && key !== 0)
         return [0, raw]
      return [key, (raw as any)[key]]
   })()
   let migrate: Migrations[number] | undefined
   while (migrate = migrations[id]) {
      obj = migrate(obj)
      ++id
   }
   // return [id, obj]
   return obj
}