import {ApiCachedElementKeyInterface} from "./ApiCachedElementKeyInterface";
import {ApiDataInterface} from "./ApiDataInterface";

export interface ApiCacheInterface {
    clear(): Promise<void>;

    getElement(key: ApiCachedElementKeyInterface): Promise<ApiDataInterface | undefined>;
    getList(key: string): Promise<ApiDataInterface[] | undefined>;
    addList(key: string, list: any[], ttl: number, included?: any): Promise<void>;
    addElement(key: ApiCachedElementKeyInterface, element: any, ttl: number, included?: any[]): Promise<void>;
    removeElement(key: ApiCachedElementKeyInterface): Promise<void>;
    addNewElementToList(listKey: string, element: any, ttl: number, included?: any[]): Promise<void>;
}