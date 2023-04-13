// import Cookies from "universal-cookie";
// import {DataFactory} from "../factories/DataFactory";
// import {DataClassInterface} from "../interfaces/DataClassInterface";
// import {DataInterface} from "../interfaces/DataInterface";
// import {ApiCallerInterface} from "../interfaces/ApiCallerInterface";
// import {CacheExpiration} from "../enums/CacheExpiration";
// import {LocalApiCache} from "../cache/LocalApiCache";
// import {LinkRouter} from "../routing/LinkRouter";
// import {RoutingTypeInterface} from "../interfaces/RoutingTypeInterface";
// import {Routing} from "../routing/Routing";
//
// export const routing = new Routing();
//
// export class ApiCaller implements ApiCallerInterface{
//     async getSingle<T extends DataInterface, Routes>(
//         objectClass: DataClassInterface<T, Routes>,
//         id?: string,
//         endpoint?: string,
//         cache?: CacheExpiration,
//     ): Promise<T> {
//         const url = this._generateUrl(routing.get(+objectClass.route), endpoint, id);
//         cache = cache ?? objectClass.cacheExpiration;
//         const data = await this._fetch(url, cache);
//
//         if (cache !== CacheExpiration.NoCache)
//             LocalApiCache.setCache(url, data);
//
//         const jsonApi = JSON.parse(data);
//
//         if (jsonApi.data === undefined)
//             throw new Error("404");
//
//         if (Array.isArray(jsonApi.data))
//             return DataFactory.create(objectClass, jsonApi.data[0]);
//
//         return  DataFactory.create(objectClass, jsonApi.data);
//     }
//
//     async getList<T extends DataInterface, Routes>(
//         objectClass: DataClassInterface<T, Routes>,
//         endpoint?: string,
//         cache?: CacheExpiration,
//         maxResults?: number,
//     ): Promise<T[]> {
//         const url = this._generateUrl(routing.get(+objectClass.route), endpoint);
//
//         return this.getListFromUrl(objectClass, url, cache);
//     }
//
//     async getListFromUrl<T extends DataInterface>(
//         objectClass: DataClassInterface<T, any>,
//         url: string,
//         cache?: CacheExpiration,
//     ): Promise<T[]> {
//         cache = cache ?? objectClass.cacheExpiration;
//
//         const fetchDataRecursively = async (url: string): Promise<any[]> => {
//             const data = await this._fetch(url, cache);
//             const jsonApi = JSON.parse(data);
//
//             let nextPageData: any[] = [];
//
//             if (jsonApi.links && jsonApi.links.next) {
//                 nextPageData = await fetchDataRecursively(jsonApi.links.next);
//             }
//
//             return Array.isArray(jsonApi.data) ? jsonApi.data.concat(nextPageData) : [jsonApi.data].concat(nextPageData);
//         };
//
//         const allData = await fetchDataRecursively(url);
//         const combinedJsonApi = { data: allData };
//
//         if (cache !== CacheExpiration.NoCache) {
//             LocalApiCache.setCache(url, JSON.stringify(combinedJsonApi));
//         }
//
//         return DataFactory.createList(objectClass, combinedJsonApi);
//     }
//
//     async patch(
//         object: DataInterface,
//         jsonApi: any,
//     ): Promise<boolean> {
//         const url = object.data.links.self;
//
//         const cookies = new Cookies();
//         const headersInit: HeadersInit = {};
//         headersInit.Authorization = "Bearer " + cookies.get("token");
//         headersInit.ContentType = "application/json";
        //
        // const requestInit: RequestInit = {};
        // requestInit.headers = headersInit;
        // requestInit.method = "PATCH";
        // requestInit.body = JSON.stringify(jsonApi);
        //
        // return fetch(url, requestInit)
        //     .then((response: Response) => {
        //         LocalApiCache.clear(url);
        //
        //         LocalApiCache.clear(LinkRouter.getApiEndpoint(Object.getPrototypeOf(object).constructor.route));
        //
        //         return true;
        //     })
        //     .catch((reason: any) => {
        //         console.log(reason);
        //         return false;
        //     });
    // }
    //
    // private _generateUrl(
    //     route?: RoutingTypeInterface,
    //     endpoint?: string,
    //     id?: string,
    // ): string {
    //     if (endpoint !== undefined)
    //         return endpoint;
    //
    //     if (route !== undefined)
    //         return LinkRouter.getApiEndpoint(route, id);
    //
    //     throw new Error("");
    // }
    //
    // private async _fetch(
    //     url: string,
    //     cache?: CacheExpiration,
    // ): Promise<string> {
    //     if (!url.startsWith("http"))
    //         url = (process.env.REACT_APP_API_URL ?? "") + url;
    //
    //     let cachedResult: string|null = null;
    //
    //     if (cache !== CacheExpiration.NoCache)
    //         cachedResult = LocalApiCache.getCache(url);
    //
    //     if (cachedResult !== null)
    //         return cachedResult;
    //
    //     const cookies = new Cookies();
    //     const bearer = cookies.get("token");
    //     const requestInit: RequestInit = {};
    //     const headersInit: HeadersInit = {};
    //     headersInit.Authorization = "Bearer " + bearer;
    //     requestInit.headers = headersInit;
    //     requestInit.cache = "no-cache";
    //
    //     let expire: string|null = null;
    //     const data: string = await fetch(url, requestInit)
    //         .then((response: Response) => {
    //             expire = response.headers.get('Expires');
    //
    //             return response.text();
    //         });
    //
    //     if (cache !== CacheExpiration.NoCache && expire !== null) {
    //         const expirationDate = new Date(expire);
    //         if (expirationDate > new Date(Date.now()))
    //             LocalApiCache.setCacheExpiration(url, expirationDate);
    //
    //     }
    //
    //     return data;
    // }
// }