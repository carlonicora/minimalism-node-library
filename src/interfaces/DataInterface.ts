import {DataType} from "../enums/DataType";
import {DataClassInterface} from "./DataClassInterface";

export interface DataInterface {
    load(loadChildren?: boolean) : Promise<void>

    get data(): any;
    get included(): any[] | undefined;
    get type(): string;
    get id(): string;
    get self(): string;

    cleanChildren<T extends DataInterface, Routes>(type?: DataClassInterface<T, Routes>,): void;
    getRelationshipLink<T extends DataInterface, Routes>(type: DataClassInterface<T, Routes>, plural?: boolean): string|undefined
    getLink(type: string): string|undefined;
    importData(data: any, includedData?: any[]): void;
    createFormState(): any;
    createJsonApiFromState(state: any): Promise<any>;
    loadSpecificRelationships(relationshipsToLoad?: Array<keyof this>, maxResult?: number): Promise<void>;
}