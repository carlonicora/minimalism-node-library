import { DataClassInterface } from "../interfaces/DataClassInterface";
import { DataInterface } from "../interfaces/DataInterface";
import {RequestHandlerInterface} from "../interfaces/RequestHandlerInterface";
import {CacheExpiration} from "../enums/CacheExpiration";
import {DataFactory} from "../factories/DataFactory";
import Cookies from "universal-cookie";
import {LinkRouter} from "../routing/LinkRouter";
import {RoutingTypeInterface} from "../interfaces/RoutingTypeInterface";
import {Routing} from "../routing/Routing";
import {ApiCacheInterface} from "../interfaces/ApiCacheInterface";
import {ApiCache} from "../cache/ApiCache";
import {ApiCachedElementKeyInterface} from "../interfaces/ApiCachedElementKeyInterface";

export const routing = new Routing();

export class RequestHandler implements RequestHandlerInterface {
    // private cacheManager: CacheManager;
    private _apiCache: ApiCacheInterface;

    constructor() {
        // this.cacheManager = new CacheManager();
        this._apiCache = new ApiCache();
    }

    private _cacheExpirationToSeconds(expiration: CacheExpiration): number {
        switch (expiration) {
            case CacheExpiration.Hour:
                return 60 * 60 * 1000;
            case CacheExpiration.Day:
                return 24 * 60 * 60 * 1000;
            case CacheExpiration.Forever:
                return 30 * 24 * 60 * 60 * 1000;
            case CacheExpiration.NoCache:
            default:
                return 0;
        }
    }

    async getSingle<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        id: string,
        endpoint?: string,
        cache?: CacheExpiration
    ): Promise<T> {
        const url = this._generateUrl(routing.get(+objectClass.route), endpoint, id);
        cache = cache ?? objectClass.cacheExpiration;

        let name = objectClass.name.toLowerCase();
        if (name.startsWith("_"))
            name = name.substr(1);

        const key: ApiCachedElementKeyInterface = {type: name, id: id};

        // const cachedDataObject = await this.cacheManager.get(url);
        const cachedDataObject = await this._apiCache.getElement(key);
        if (cachedDataObject) {
            const cachedResponse: T = DataFactory.create(objectClass, cachedDataObject) as T;
            await cachedResponse.load();
            return cachedResponse;
        }

        const jsonApi = await this._fetch(url);

        if (jsonApi.data === undefined)
            throw new Error("404");

        if (cache !== CacheExpiration.NoCache)
            // await this.cacheManager.set(url, jsonApi.data, this._cacheExpirationToSeconds(cache));
            await this._apiCache.addElement({type: name, id: id}, jsonApi.data, this._cacheExpirationToSeconds(cache));

        const response = DataFactory.create(objectClass, jsonApi.data);
        await response.load();

        return response;
    }

    async getList<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        endpoint?: string,
        cache?: CacheExpiration,
        maxResults?: number
    ): Promise<T[]> {
        const url = this._generateUrl(routing.get(+objectClass.route), endpoint);

        return this.getListFromUrl(objectClass, url, cache, maxResults);
    }

    async getListFromUrl<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        url: string,
        cache?: CacheExpiration,
        maxResults?: number
    ): Promise<T[]> {
        cache = cache ?? objectClass.cacheExpiration;

        const cachedList = await this._apiCache.getList(url);
        if (cachedList) {
            const cachedDataList: T[] = [];
            for (const cachedItem of cachedList) {
                const cachedResponse: T = DataFactory.create(objectClass, cachedItem) as T;
                await cachedResponse.load();
                cachedDataList.push(cachedResponse);
            }
            return cachedDataList;
        }

        let resultsCount = 0;
        const fetchDataRecursively = async (url: string): Promise<any[]> => {
            const jsonApi = await this._fetch(url);

            let nextPageData: any[] = [];

            if (
                jsonApi.links && jsonApi.links.next &&
                (maxResults !== undefined && (maxResults === 0 || resultsCount < maxResults))
            ) {
                nextPageData = await fetchDataRecursively(jsonApi.links.next);
                resultsCount++;
            }

            if (jsonApi.data === undefined)
                return [];

            return Array.isArray(jsonApi.data) ? jsonApi.data.concat(nextPageData) : [jsonApi.data].concat(nextPageData);
        };

        const allData = await fetchDataRecursively(url);
        if (allData.length === 0)
            return [];

        const dataList: T[] = allData.map((data: any) => {
            const response: T = DataFactory.create(objectClass, data);
            response.load();
            return response;
        });

        if (cache !== undefined && cache !== CacheExpiration.NoCache) {
            this._apiCache.addList(url, allData, this._cacheExpirationToSeconds(cache));

            // const idList = dataList.map(item => item.self);
            // await this.cacheManager.set(url, idList, this._cacheExpirationToSeconds(cache));
            //
            // dataList.forEach(async (item) => {
            //     const itemJsonApi = allData.find((data: any) => data.id === item.id);
            //     await this.cacheManager.set(
            //         item.self,
            //         itemJsonApi,
            //         this._cacheExpirationToSeconds(cache as CacheExpiration)
            //     );
            // });
        }

        return dataList;
    }

    async patch<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        jsonApi: any,
    ): Promise<boolean> {
        const url = this._generateUrl(routing.get(+objectClass.route),undefined, jsonApi.data.id);

        const cookies = new Cookies();
        const bearer = cookies.get("token");
        const requestInit: RequestInit = {};
        const headersInit: HeadersInit = {};
        headersInit.Authorization = "Bearer " + bearer;
        requestInit.headers = headersInit;
        requestInit.cache = "no-cache";
        requestInit.method = "PATCH";
        requestInit.body = JSON.stringify(jsonApi);

        return fetch(url, requestInit)
            .then((response: Response) => {
                return response.json()
                    .then((jsonApi: any) => {
                        return this._apiCache.addElement({type: jsonApi.data.type, id: jsonApi.data.id}, jsonApi.data, this._cacheExpirationToSeconds(objectClass.cacheExpiration))
                            .then(() => {
                                return true;
                            });
                    }).catch((reason: any) => {
                        return false;
                    });
            })
            .catch((reason: any) => {
                console.log(reason);
                return false;
            });
    }

    async post<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        jsonApi: any,
        file?: File,
        listUrl?: string,
    ): Promise<T> {
        const url = this._generateUrl(routing.get(+objectClass.route));

        const cookies = new Cookies();
        const bearer = cookies.get("token");
        const requestInit: RequestInit = {};
        const headersInit: HeadersInit = {};
        headersInit.Authorization = "Bearer " + bearer;
        requestInit.headers = headersInit;
        requestInit.cache = "no-cache";
        requestInit.method = "POST";

        if (file) {
            const formData = new FormData();
            formData.append("payload", JSON.stringify(jsonApi));
            formData.append("file", file);
            requestInit.body = formData;
        } else {
            requestInit.body = JSON.stringify(jsonApi);
        }

        return fetch(url, requestInit)
            .then((response: Response) => {
                return response.json()
                    .then((jsonApi: any) => {
                        const response: T = DataFactory.create(objectClass, jsonApi.data);
                        // this.cacheManager.set(response.self, jsonApi.data, this._cacheExpirationToSeconds(objectClass.cacheExpiration));

                        if (listUrl) {
                            this._apiCache.addNewElementToList(listUrl, jsonApi.data, this._cacheExpirationToSeconds(objectClass.cacheExpiration));
                        } else {
                            this._apiCache.addElement({type: jsonApi.data.type, id: jsonApi.data.id}, jsonApi.data, this._cacheExpirationToSeconds(objectClass.cacheExpiration));
                        }

                        return response;
                    });
            });
    }

    private _generateUrl(
        route?: RoutingTypeInterface,
        endpoint?: string,
        id?: string,
    ): string {
        if (endpoint !== undefined)
            return endpoint;

        if (route !== undefined)
            return LinkRouter.getApiEndpoint(route, id);

        throw new Error("");
    }

    private async _fetch(url: string): Promise<any> {
        if (!url.startsWith("http"))
            url = (process.env.REACT_APP_API_URL ?? "") + url;

        const cookies = new Cookies();
        const bearer = cookies.get("token");
        const requestInit: RequestInit = {};
        const headersInit: HeadersInit = {};
        headersInit.Authorization = "Bearer " + bearer;
        requestInit.headers = headersInit;
        requestInit.cache = "no-cache";

        return await fetch(url, requestInit).then((response: Response) => {
            return response.json();
        });
    }
}
