import {DataType} from "../enums/DataType";

export interface DataInterface {
    load(loadChildren?: boolean) : Promise<void>

    get data(): any;
    get type(): string;
    get id(): string;
    get self(): string;

    getRelationshipLink(type: DataType): string|undefined
    getLink(type: string): string|undefined;
    importData(data: any): void;
    createFormState(): any;
    createJsonApiFromState(state: any): Promise<any>;
    loadSpecificRelationships(relationshipsToLoad?: Array<keyof this>, maxResult?: number): Promise<void>;
}