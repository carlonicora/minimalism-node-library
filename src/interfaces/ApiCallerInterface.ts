// import {DataInterface} from "./DataInterface";
// import {DataClassInterface} from "./DataClassInterface";
// import {CacheExpiration} from "../enums/CacheExpiration";
//
// export interface ApiCallerInterface {
//     getList<T extends DataInterface, Routes>(
//         objectClass: DataClassInterface<T, Routes>,
//         endpoint?: string,
//         cache?: CacheExpiration,
//     ): Promise<T[]>;
//
//     getListFromUrl<T extends DataInterface>(
//         objectClass: DataClassInterface<T, any>,
//         url: string,
//         cache?: CacheExpiration,
//     ): Promise<T[]>;
//
//     getSingle<T extends DataInterface, Routes>(
//         objectClass: DataClassInterface<T, Routes> | string,
//         id?: string,
//         endpoint?: string,
//         cache?: CacheExpiration,
//     ): Promise<T>;
//
//     patch(
//         object: DataInterface,
//         jsonApi: any,
//     ): Promise<boolean>;
// }