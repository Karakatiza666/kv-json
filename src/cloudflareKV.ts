import type { KVJson } from "src/kv"
import { BSON } from 'bsonfy'

export const jsonFromKVNamespace = (o: KVNamespace): KVJson => ({
   get<T>(key: string) { return o.get(key, 'json').then(b => b as T | null) },
   req<T>(key: string) { return o.get(key, 'json').then(b => {
         if (b === null) { throw new Error('KV: ' + key + ' not found!') }
         return b as T
      })
   },
   put<T>(key: string, value: T) { return o.put(key, JSON.stringify(value)) },
   raw: {
      get(key) {
         return o.get(key, 'arrayBuffer').then(b => b ? new Uint8Array(b) : b)
      },
      req(key) {
         return o.get(key, 'arrayBuffer').then(b => {
            if (b === null) { throw new Error('KV: ' + key + ' not found!') }
            return new Uint8Array(b)
         })
      },
      put(key, value) { return o.put(key, value) },
   }
})

export const jsonFromR2Bucket = (o: R2Bucket): KVJson => ({
   get<T>(key: string) { return o.get(key).then(async r => r ? r.json<T>() : null) },
   req<T>(key: string) { return o.get(key).then(async r => {
         if (!r) throw new Error('KV: ' + key + ' not found!')
         return r.json<T>()
      })
   },
   async put<T>(key: string, value: T) { await o.put(key, JSON.stringify(value)) },
   raw: {
      get(key) {
         return o.get(key).then(async b => b ? new Uint8Array(await b.arrayBuffer()) : b)
      },
      req(key) {
         return o.get(key).then(async b => {
            if (b === null) { throw new Error('KV: ' + key + ' not found!') }
            return new Uint8Array(await b.arrayBuffer())
         })
      },
      async put(key, value) { await o.put(key, value) },
   }
})

// =================

export const bsonFromKVNamespace = (o: KVNamespace): KVJson => ({
   get<T>(key: string) { return o.get(key, 'arrayBuffer').then(b => b ? BSON.deserialize(new Uint8Array(b)) : null) as T },
   req<T>(key: string) { return o.get(key, 'arrayBuffer').then(b => {
         if (b === null) { throw new Error('KV: ' + key + ' not found!') }
         return BSON.deserialize(new Uint8Array(b)) as T
      })
   },
   put<T>(key: string, value: T) { return o.put(key, BSON.serialize(value)) },
   raw: {
      get(key) {
         return o.get(key, 'arrayBuffer').then(b => b ? new Uint8Array(b) : b)
      },
      req(key) {
         return o.get(key, 'arrayBuffer').then(b => {
            if (b === null) { throw new Error('KV: ' + key + ' not found!') }
            return new Uint8Array(b)
         })
      },
      put(key, value) { return o.put(key, value) },
   }
})

export const bsonFromR2Bucket = (o: R2Bucket): KVJson => ({
   get<T>(key: string) { return o.get(key).then(async r => r ? (await BSON.deserialize(new Uint8Array(await r.arrayBuffer()))) as T : null) },
   req<T>(key: string) { return o.get(key).then(async r => {
         if (!r) throw new Error('KV: ' + key + ' not found!')
         return BSON.deserialize(new Uint8Array(await r.arrayBuffer())) as T
      })
   },
   async put<T>(key: string, value: T) { await o.put(key, BSON.serialize(value)) },
   raw: {
      get(key) {
         return o.get(key).then(async b => b ? new Uint8Array(await b.arrayBuffer()) : b)
      },
      req(key) {
         return o.get(key).then(async b => {
            if (b === null) { throw new Error('KV: ' + key + ' not found!') }
            return new Uint8Array(await b.arrayBuffer())
         })
      },
      async put(key, value) { await o.put(key, value) },
   }
})

// =================

export const ordBsonFromKVNamespace = (o: KVNamespace): KVJson => ({
   get<T>(key: string) { return o.get(key, 'arrayBuffer').then(b => b ? BSON.deserialize(new Uint8Array(b)) : null) as T },
   req<T>(key: string) { return o.get(key, 'arrayBuffer').then(b => {
         if (!b) { throw new Error('KV: ' + key + ' not found!') }
         return BSON.deserialize(new Uint8Array(b)) as T
      })
   },
   put<T>(key: string, value: T) { return o.put(key, BSON.serializeOrdered(value)) },
   raw: {
      get(key) {
         return o.get(key, 'arrayBuffer').then(b => b ? new Uint8Array(b) : b)
      },
      req(key) {
         return o.get(key, 'arrayBuffer').then(b => {
            if (b === null) { throw new Error('KV: ' + key + ' not found!') }
            return new Uint8Array(b)
         })
      },
      put(key, value) { return o.put(key, value) },
   }
})

export const ordBsonFromR2Bucket = (o: R2Bucket): KVJson => ({
   get<T>(key: string) {
      return o.get(key).then(async r => r ? (await BSON.deserialize(new Uint8Array(await r.arrayBuffer()))) as T : null)
   },
   req<T>(key: string) {
      return o.get(key).then(async r => {
         if (!r) throw new Error('KV: ' + key + ' not found!')
         return BSON.deserialize(new Uint8Array(await r.arrayBuffer())) as T
      })
   },
   async put<T>(key: string, value: T) { await o.put(key, BSON.serializeOrdered(value)) },
   raw: {
      get(key) {
         return o.get(key).then(async b => b ? new Uint8Array(await b.arrayBuffer()) : b)
      },
      req(key) {
         return o.get(key).then(async b => {
            if (b === null) { throw new Error('KV: ' + key + ' not found!') }
            return new Uint8Array(await b.arrayBuffer())
         })
      },
      async put(key, value) { await o.put(key, value) },
   }
})