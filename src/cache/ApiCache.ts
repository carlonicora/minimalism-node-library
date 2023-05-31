import {ApiCacheInterface} from "../interfaces/ApiCacheInterface";
import {ApiCacheElementInterface} from "../interfaces/ApiCacheElementInterface";
import {ApiCachedElementKeyInterface} from "../interfaces/ApiCachedElementKeyInterface";
import {ApiCacheElements} from "./ApiCacheElements";
import {ApiDataInterface} from "../interfaces/ApiDataInterface";

export class ApiCache implements ApiCacheInterface {
    private _dbPromise: Promise<IDBDatabase>;
    private _objectStoreNames: string[] = ['lists', 'elements', 'indexes'];

    constructor(
        private _applicationName: string,
    ) {
        this._dbPromise = this._openDatabase('lists');
    }

    private _openDatabase(objectStore: string): Promise<IDBDatabase> {
        if (typeof window !== "undefined") {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this._applicationName, 1);

                request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                    const db = (event.target as IDBOpenDBRequest).result;

                    // Create 'lists' object store if they don't exist
                    for (const objectStoreName of this._objectStoreNames) {
                        if (!db.objectStoreNames.contains(objectStoreName)) {
                            db.createObjectStore(objectStoreName, { keyPath: 'key' });
                        }
                    }
                };

                request.onsuccess = (event: Event) => {
                    resolve((event.target as IDBOpenDBRequest).result);
                };

                request.onerror = (event: Event) => {
                    reject((event.target as IDBOpenDBRequest).error);
                };
            });
        } else {
            throw new Error("indexedDB not available on the server");
        }
    }

    private async _getCacheElement(
        storeName: string,
    ): Promise<ApiCacheElementInterface> {
        const db = await this._dbPromise;

        const transaction = db.transaction(storeName, "readwrite");
        const store: IDBObjectStore = transaction.objectStore(storeName);

        return new ApiCacheElements(store);
    }

    clear(): Promise<void> {
        this._objectStoreNames.map((storeName) => {
            this._getCacheElement(storeName)
                .then((objectStore) => {
                    objectStore.clear();
                });
        });

        return Promise.resolve(undefined);
    }

    async getElement(key: ApiCachedElementKeyInterface): Promise<ApiDataInterface | undefined> {
        const cache: ApiCacheElementInterface = await this._getCacheElement("elements");
        return cache.get(key);
    }

    async getList(key: string): Promise<ApiDataInterface[] | undefined> {
        const cache: ApiCacheElementInterface = await this._getCacheElement("lists");

        const responseKeys: any[]|undefined = await cache.get({id: key, type: 'lists'});

        if (!responseKeys) return undefined;

        const responsePromises: Promise<ApiDataInterface>[]  = responseKeys.map(async (responseKey: ApiCachedElementKeyInterface) => {
            const cache: ApiCacheElementInterface = await this._getCacheElement("elements");
            return cache.get(responseKey);
        });

        const response: ApiDataInterface[] = await Promise.all(responsePromises);

        return response;
    }

    async addList(key: string, list: any[], ttl: number, included?: any): Promise<void> {
        const elementKeys: ApiCachedElementKeyInterface[] = [];
        for (const element of list) {
            const elementKey: ApiCachedElementKeyInterface = {
                id: element.id,
                type: element.type,
            };
            elementKeys.push(elementKey);

            const elementCache: ApiCacheElementInterface = await this._getCacheElement("elements");
            const fullElement: ApiDataInterface = {
                data: element,
                included: included,
            };
            await elementCache.set(elementKey, fullElement, ttl);
        }

        // Save the list of keys in the 'lists' storage.
        const listCache: ApiCacheElementInterface = await this._getCacheElement("lists");
        await listCache.set({ id: key, type: 'lists' }, elementKeys, ttl);

        // Save each element's key in the 'indexes'+type object store, containing an array of list keys.
        for (const elementKey of elementKeys) {
            const indexCache: ApiCacheElementInterface = await this._getCacheElement("indexes");

            const existingListKeys: string[] | undefined = await indexCache.get(elementKey);
            if (existingListKeys) {
                existingListKeys.push(key);
                await indexCache.set(elementKey, existingListKeys, ttl);
            } else {
                await indexCache.set(elementKey, [key], ttl);
            }
        }
    }

    async addElement(key: ApiCachedElementKeyInterface, element: any, ttl: number, included?: any[]): Promise<void> {
        const elementCache: ApiCacheElementInterface = await this._getCacheElement("elements");
        const fullElement: ApiDataInterface = {
            data: element,
            included: included,
        };
        await elementCache.set(key, fullElement, ttl);
    }

    async removeElement(key: ApiCachedElementKeyInterface): Promise<void> {
        // If an indexes+type is present, remove the element from all the lists.
        const indexCache: ApiCacheElementInterface = await this._getCacheElement("indexes");
        const listKeys: string[] | undefined = await indexCache.get(key);

        if (listKeys) {
            // Remove the indexes+type for the element.
            await indexCache.delete(key);

            for (const listKey of listKeys) {
                const listCache: ApiCacheElementInterface = await this._getCacheElement("lists");
                const elementKeys: ApiCachedElementKeyInterface[] | undefined = await listCache.get({ id: listKey, type: 'lists' });

                if (elementKeys) {
                    const updatedElementKeys = elementKeys.filter(elementKey => elementKey.id !== key.id);
                    await listCache.set({ id: listKey, type: 'lists' }, updatedElementKeys, 0);
                }
            }
        }

        // Remove the element itself.
        const elementCache: ApiCacheElementInterface = await this._getCacheElement("elements");
        await elementCache.delete(key);
    }

    async addNewElementToList(listKey: string, element: any, ttl: number, included?: any[]): Promise<void> {
        // Add the new element to the list.
        const elementKey: ApiCachedElementKeyInterface = {
            id: element.id,
            type: element.type,
        };

        const listCache: ApiCacheElementInterface = await this._getCacheElement('lists');
        const elementKeys: ApiCachedElementKeyInterface[] | undefined = await listCache.get({ id: listKey, type: 'lists' });

        if (elementKeys) {
            elementKeys.push(elementKey);
            await listCache.set({ id: listKey, type: 'lists' }, elementKeys, ttl);
        } else {
            await listCache.set({ id: listKey, type: 'lists' }, [elementKey], ttl);
        }

        // Save the new element in its respective object store.
        const elementCache: ApiCacheElementInterface = await this._getCacheElement("elements");
        const fullElement: ApiDataInterface = {
            data: element,
            included: included,
        };
        await elementCache.set(elementKey, fullElement, ttl);

        // Create a new index+type for the element containing the list.
        const indexCache: ApiCacheElementInterface = await this._getCacheElement("indexes");

        const existingListKeys: string[] | undefined = await indexCache.get(elementKey);
        if (existingListKeys) {
            existingListKeys.push(listKey);
            await indexCache.set(elementKey, existingListKeys, ttl);
        } else {
            await indexCache.set(elementKey, [listKey], ttl);
        }
    }
}