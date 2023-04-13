import {DataInterface} from "./DataInterface";
import {DataClassStaticInterface} from "./DataClassStaticInterface";

export type DataClassInterface<T extends DataInterface, Routes> = {
    new (type: string): T;
} & DataClassStaticInterface<Routes>;