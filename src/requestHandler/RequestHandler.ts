import {DataClassInterface} from "../interfaces/DataClassInterface";
import {DataInterface} from "../interfaces/DataInterface";
import {RequestHandlerInterface} from "../interfaces/RequestHandlerInterface";
import {CacheExpiration} from "../enums/CacheExpiration";
import {DataFactory} from "../factories/DataFactory";
import Cookies from "universal-cookie";
import {RoutingTypeInterface} from "../interfaces/RoutingTypeInterface";
import {Routing} from "../routing/Routing";
import {ApiCacheInterface} from "../interfaces/ApiCacheInterface";
import {ApiCache} from "../cache/ApiCache";
import {ApiCachedElementKeyInterface} from "../interfaces/ApiCachedElementKeyInterface";
import {Minimalism} from "../Minimalism";
import {ApiDataInterface} from "../interfaces/ApiDataInterface";
import {HTTPError} from "../errors/HTTPError";

export const routing = new Routing();

interface jsonApiInterface {
    data: any[] | any;
    included: any[];
}

export class RequestHandler implements RequestHandlerInterface {
    private _apiCache: ApiCacheInterface;

    constructor(
        private _apiUrl: string,
        private _applicationName: string,
    ) {
        this._apiCache = new ApiCache(_applicationName);
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
        cache?: CacheExpiration,
        skipCache?: boolean,
    ): Promise<T> {
        const url = this._generateUrl(routing.get(+objectClass.route), endpoint, id);
        cache = cache ?? objectClass.cacheExpiration;

        let name = objectClass.name.toLowerCase();
        if (name.startsWith("_"))
            name = name.substr(1);

        const key: ApiCachedElementKeyInterface = {type: name, id: id};

        if (!skipCache || skipCache === undefined) {
            const cachedDataObject: ApiDataInterface | undefined = await this._apiCache.getElement(key);
            if (cachedDataObject) {
                const cachedResponse: T = DataFactory.create(objectClass, cachedDataObject.data, cachedDataObject.included) as T;
                await cachedResponse.load();
                return cachedResponse;
            }
        }

        const jsonApi = await this._fetch(url);

        if (jsonApi.data === undefined)
            throw new Error("404");

        if (cache !== CacheExpiration.NoCache)
            // await this.cacheManager.set(url, jsonApi.data, this._cacheExpirationToSeconds(cache));
            await this._apiCache.addElement({type: name, id: id}, jsonApi.data, this._cacheExpirationToSeconds(cache), jsonApi.included);

        const response: T = DataFactory.create(objectClass, jsonApi.data, jsonApi.included) as T;
        await response.load();

        return response;
    }

    async getList<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        endpoint?: string,
        cache?: CacheExpiration,
        maxResults?: number,
        params?: Map<string,string>,
    ): Promise<T[]> {
        const url = this._generateUrl(routing.get(+objectClass.route), endpoint, undefined, params);

        return this.getListFromUrl(objectClass, url, cache, maxResults);
    }

    async getListFromUrl<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        url: string,
        cache?: CacheExpiration,
        maxResults?: number
    ): Promise<T[]> {
        cache = cache ?? objectClass.cacheExpiration;

        if (cache !== CacheExpiration.NoCache) {
            const cachedList = await this._apiCache.getList(url);
            if (cachedList) {
                const cachedDataList: T[] = [];
                for (const cachedItem of cachedList) {
                    const cachedResponse: T = DataFactory.create(objectClass, cachedItem.data, cachedItem.included) as T;
                    await cachedResponse.load();
                    cachedDataList.push(cachedResponse);
                }
                return cachedDataList;
            }
        }

        let resultsCount = 0;
        const fetchDataRecursively = async (url: string): Promise<jsonApiInterface> => {
            const jsonApi = await this._fetch(url);

            let nextPageData: jsonApiInterface = {
                data: [],
                included: []
            };

            if (
                jsonApi.links && jsonApi.links.next &&
                (maxResults !== undefined && (maxResults === 0 || resultsCount < maxResults))
            ) {
                nextPageData = await fetchDataRecursively(jsonApi.links.next);
                resultsCount++;
            }

            if (jsonApi.data === undefined)
                return nextPageData ?? {data: []};

            return this._mergeJsonApiData(jsonApi, nextPageData);
        };

        const allData = await fetchDataRecursively(url);
        if (allData.data.length === 0)
            return [];

        const dataList: T[] = allData.data.map((data: any) => {
            const response: T = DataFactory.create(objectClass, data, allData.included) as T;
            response.load();
            return response;
        });

        if (cache !== undefined && cache !== CacheExpiration.NoCache) {
            this._apiCache.addList(url, allData.data, this._cacheExpirationToSeconds(cache), allData.included);
        }

        return dataList;
    }

    private _mergeJsonApiData(
        jsonApi1: jsonApiInterface,
        jsonApi2: jsonApiInterface
    ): jsonApiInterface {
        // Concatenate data arrays
        const data1 = Array.isArray(jsonApi1.data) ? jsonApi1.data : [jsonApi1.data];
        const data2 = Array.isArray(jsonApi2.data) ? jsonApi2.data : [jsonApi2.data];
        const mergedData = data1.concat(data2);

        // Concatenate included arrays, if they exist
        const included1 = jsonApi1.included || [];
        const included2 = jsonApi2.included || [];
        const mergedIncluded = included1.concat(included2);

        // Return new JsonApiInterface object
        return {
            data: mergedData,
            included: mergedIncluded,
        };
    }

    async post<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        jsonApi: any,
        file?: File,
        listUrl?: string,
    ): Promise<T> {
        const url = this._generateUrl(routing.get(+objectClass.route));

        return this._postOrPatch("POST", url, objectClass, jsonApi, file, listUrl);
    }

    async patch<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        jsonApi: any,
        file?: File,
        listUrl?: string,
    ): Promise<T> {
        const url = this._generateUrl(routing.get(+objectClass.route),undefined, jsonApi.data.id);
        return this._postOrPatch("PATCH", url, objectClass, jsonApi, file, listUrl);
    }

    private _generateRequestInit(
        method: string
    ): RequestInit {
        const cookies = new Cookies();
        const bearer = cookies.get("token");
        const response: RequestInit = {};
        const headersInit: HeadersInit = {};
        headersInit.Authorization = "Bearer " + bearer;
        response.headers = headersInit;
        response.cache = "no-cache";
        response.method = method;

        return response;
    }

    private async _postOrPatch<T extends DataInterface>(
        method: string,
        url: string,
        objectClass: DataClassInterface<T, any>,
        jsonApi: any,
        file?: File,
        listUrl?: string,
    ): Promise<T> {
        const requestInit = this._generateRequestInit(method);

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
                if (!response.ok)
                    throw new HTTPError('HTTP error', response.status);

                return response.json()
                    .then((jsonApi: any) => {
                        const response: T = DataFactory.create(objectClass, jsonApi.data, jsonApi.included);

                        if (listUrl) {
                            this._apiCache.addNewElementToList(listUrl, jsonApi.data, this._cacheExpirationToSeconds(objectClass.cacheExpiration), jsonApi.included);
                        } else {
                            this._apiCache.addElement({type: jsonApi.data.type, id: jsonApi.data.id}, jsonApi.data, this._cacheExpirationToSeconds(objectClass.cacheExpiration), jsonApi.included);
                        }

                        return response;
                    });
            });
    }

    async delete<T extends DataInterface>(
        objectClass: DataClassInterface<T, any>,
        id: string,
    ): Promise<boolean> {
        const url = this._generateUrl(routing.get(+objectClass.route), undefined, id);

        const requestInit = this._generateRequestInit("DELETE");

        return fetch(url, requestInit)
            .then((response: Response) => {
                if (!response.ok)
                    return false;

                let name = objectClass.name.toLowerCase();
                if (name.startsWith("_"))
                    name = name.substr(1);

                if (objectClass.cacheExpiration === CacheExpiration.NoCache)
                    return true;

                return this._apiCache.removeElement({type: name, id: id})
                    .then(() => {
                        return true;
                    });
            });
    }

    private _generateUrl(
        route?: RoutingTypeInterface,
        endpoint?: string,
        id?: string,
        params?: Map<string, string>,
    ): string {
        if (endpoint !== undefined) {
            return this._addParams(endpoint, params);
        }

        if (route === undefined)
            throw new Error("");

        let response = Minimalism.linkRouter.getApiEndpoint(route, id);

        return this._addParams(response, params);
    }

    private _addParams(
        endpoint: string,
        params?: Map<string, string>,
    ): string {
        let response = endpoint;

        if (params !== undefined) {
            response += "?";
            params.forEach((value: string, key: string) => {
                response += key + "=" + value + "&";
            });
            response = response.substr(0, response.length - 1);
        }

        return response;
    }

    private async _fetch(url: string): Promise<any> {
        if (!url.startsWith("http"))
            url = this._apiUrl + url;

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
