import {ApiCachedElementKeyInterface} from "./ApiCachedElementKeyInterface";

export interface ApiCacheInterface {
    clear(): Promise<void>;

    getElement(key: ApiCachedElementKeyInterface): Promise<any | undefined>;
    getList(key: string): Promise<any[] | undefined>;
    addList(key: string, list: any[], ttl: number): Promise<void>;
    addElement(key: ApiCachedElementKeyInterface, element: any, ttl: number): Promise<void>;
    removeElement(key: ApiCachedElementKeyInterface): Promise<void>;
    addNewElementToList(listKey: string, element: any, ttl: number): Promise<void>;
}