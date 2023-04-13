import {DataClassInterface} from "../interfaces/DataClassInterface";
import {DataInterface} from "../interfaces/DataInterface";

export class DataFactory {
    public static createList<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        data: any,
    ): T[] {
        const response: T[] = [];

        if (data.data === undefined)
            return [];

        if (data.data.attributes !== undefined){
            response.push(this.create(objectClass, data.data));
        } else {
            for(let index=0; index<data.data.length; index++){
                response.push(this.create(objectClass, data.data[index]));
            }
        }

        return response;
    }

    public static create<T extends DataInterface, Routes>(
        objectClass: DataClassInterface<T, Routes>,
        data?: any,
    ): T {
        let name = objectClass.name.toLowerCase();
        if (name.startsWith("_"))
            name = name.substr(1);

        const response = new objectClass(name);

        if (data !== undefined)
            response.importData(data);

        return response;
    }
}