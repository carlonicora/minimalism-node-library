import {DataInterface} from "./DataInterface";
import {DataClassInterface} from "./DataClassInterface";
import {CacheExpiration} from "../enums/CacheExpiration";

export interface RequestHandlerInterface {
    getSingle<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        id: string,
        endpoint?: string,
        cache?: CacheExpiration,
        skipCache?: boolean,
    ): Promise<T>;

    getList<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        endpoint?: string,
        cache?: CacheExpiration,
        maxResults?: number,
        params?: Map<string,string>,
    ): Promise<T[]>;

    getListFromUrl<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        url: string,
        cache?: CacheExpiration,
        maxResults?: number
    ): Promise<T[]>;

    patch<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        jsonApi: any,
        file?: File,
        listUrl?: string,
    ): Promise<T>;

    delete<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        id: string,
    ): Promise<boolean>;

    post<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        jsonApi: any,
        file?: File,
        listUrl?: string,
    ): Promise<T>;
}
