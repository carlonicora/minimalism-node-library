import {CacheItemInterface} from "../interfaces/CacheItemInterface";

export class CacheManager {
    private _dbPromise: Promise<IDBDatabase>;

    constructor() {
        this._dbPromise = this._openDatabase();
    }

    private _openDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('cacheDB', 1);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                db.createObjectStore('cacheItems', { keyPath: 'key' });
            };

            request.onsuccess = (event: Event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    private async _getObjectStore(
        mode: IDBTransactionMode
    ): Promise<IDBObjectStore> {
        const db = await this._dbPromise;
        const transaction = db.transaction('cacheItems', mode);
        return transaction.objectStore('cacheItems');
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        const objectStore = await this._getObjectStore("readwrite");
        const timestamp = ttl ? Date.now() + ttl : null;
        const cacheItem: CacheItemInterface<string> = {
            key,
            value: value,
            timestamp,
        };
        objectStore.put(cacheItem);
    }

    public async get(key: string): Promise<any | null> {
        const objectStore = await this._getObjectStore("readonly");
        const cacheItemRequest = objectStore.get(key);

        return new Promise<any | null>((resolve, reject) => {
            cacheItemRequest.onsuccess = () => {
                const cacheItem: CacheItemInterface<string> | undefined =
                    cacheItemRequest.result;

                if (!cacheItem) {
                    resolve(null);
                } else {
                    if (
                        cacheItem.timestamp !== null &&
                        Date.now() > cacheItem.timestamp
                    ) {
                        this.delete(key).then(() => resolve(null));
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


    public async delete(key: string): Promise<void> {
        const objectStore = await this._getObjectStore('readwrite');
        objectStore.delete(key);
    }

    public async clear(): Promise<void> {
        const objectStore = await this._getObjectStore('readwrite');
        objectStore.clear();
    }
}
