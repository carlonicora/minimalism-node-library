import {DataClassInterface} from "../interfaces/DataClassInterface";
import {DataInterface} from "../interfaces/DataInterface";

export class DataFactory {
    public static createList<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        data: any,
        includedData?: any,
    ): T[] {
        const response: T[] = [];

        if (data.data === undefined)
            return [];

        if (data.data.attributes !== undefined){
            response.push(this.create(objectClass, data.data, includedData));
        } else {
            for(let index=0; index<data.data.length; index++){
                response.push(this.create(objectClass, data.data[index], includedData));
            }
        }

        return response;
    }

    public static create<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        data?: any,
        includedData?: any,
    ): T {
        let name = objectClass.name.toLowerCase();
        if (name.startsWith("_"))
            name = name.substr(1);

        const response = new objectClass(name);

        if (data !== undefined)
            response.importData(data, includedData);

        return response;
    }
}