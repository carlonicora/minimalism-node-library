import {ApiCacheElementInterface} from "../interfaces/ApiCacheElementInterface";
import {ApiCachedElementKeyInterface} from "../interfaces/ApiCachedElementKeyInterface";
import {CacheItemInterface} from "../interfaces/CacheItemInterface";

export class ApiCacheElements implements ApiCacheElementInterface {
    constructor(
        private _storage: IDBObjectStore,
    ) {
    }

    async set(key: ApiCachedElementKeyInterface, data: any, ttl: number): Promise<void> {
        const timestamp = ttl ? Date.now() + ttl : null;
        const cacheItem: CacheItemInterface<string> = {
            key: key.type + "_" + key.id,
            value: data,
            timestamp: timestamp,
        };

        this._storage.put(cacheItem);
    }

    async get(key: ApiCachedElementKeyInterface): Promise<any | undefined> {
        const cacheItemRequest = this._storage.get(key.type + "_" + key.id);

        return new Promise<any | null>((resolve, reject) => {
            cacheItemRequest.onsuccess = () => {
                const cacheItem: CacheItemInterface<string> | undefined =
                    cacheItemRequest.result;

                if (!cacheItem) {
                    resolve(undefined);
                } else {
                    if (cacheItem.timestamp !== null && Date.now() > cacheItem.timestamp) {
                        this.delete(key)
                            .then(() => resolve(null));
                    } else {
                        resolve(cacheItem.value);
                    }
                }
            };

            cacheItemRequest.onerror = () => {
                reject(cacheItemRequest.error);
            };
        });
    }

    async delete(key: ApiCachedElementKeyInterface): Promise<void> {
        this._storage.delete(key.type + "_" + key.id);
    }

    async clear(): Promise<void> {
        this._storage.clear();
    }
}