import {CacheExpiration} from "../enums/CacheExpiration";

export interface DataClassStaticInterface<Routes> {
    cacheExpiration: CacheExpiration;
    route: Routes;
}