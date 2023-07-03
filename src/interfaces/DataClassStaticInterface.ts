import {CacheExpiration} from "../enums/CacheExpiration";

export interface DataClassStaticInterface<Routes> {
    className: string;
    cacheExpiration: CacheExpiration;
    route: Routes;
}