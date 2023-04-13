import {ApiCachedElementKeyInterface} from "./ApiCachedElementKeyInterface";

export interface ApiCacheElementInterface {
    set(key: ApiCachedElementKeyInterface, data: any, ttl: number): Promise<void>;
    get(key: ApiCachedElementKeyInterface): Promise<any | undefined>;
    delete(key: ApiCachedElementKeyInterface): Promise<void>;
    clear(): Promise<void>;
}