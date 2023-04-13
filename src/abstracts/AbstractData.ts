import {DataType} from "../enums/DataType";
// import {ApiCaller} from "../api/ApiCaller";
import {DataInterface} from "../interfaces/DataInterface";
import {DataClassInterface} from "../interfaces/DataClassInterface";
import {CacheExpiration} from "../enums/CacheExpiration";
import {Pluraliser} from "../utils/Pluraliser";
import {api} from "../init";

export abstract class AbstractData implements DataInterface{
    private _type: string;
    private _id: string|undefined;

    protected _data: any;
    protected _children: Map<DataClassInterface<any, any>, DataInterface|DataInterface[]> = new Map<DataClassInterface<any, any>, DataInterface[]>();

    constructor(type: string) {
        this._type = type;
    }

    importData(data: any): void {
        this._data = data;
        this._type = data.type;
        this._id = data.id;
    }

    async load(
        loadChildren = false,
    ): Promise<void> {
        if (loadChildren){
            const loadPromises: Promise<void>[] = [];

            for (const [, childData] of this._children.entries()) {
                if (Array.isArray(childData)) {
                    for (const child of childData) {
                        loadPromises.push(child.load());
                    }
                } else {
                    loadPromises.push(childData.load());
                }
            }

            await Promise.all(loadPromises);
        }
    }

    get data(): any {
        return this._data;
    }

    get type(): string{
        return this._type;
    }

    get id(): string {
        if (this._id === undefined)
            throw new Error("");

        return this._id;
    }

    get self(): string {
        if (this._data.links === undefined)
            throw new Error("");

        return this._data.links.self;
    }

    createFormState(): any {
        const response: any = {
        };

        if (this._id !== undefined)
            response.id = this._id;

        return response;
    }

    async createJsonApiFromState(state: any): Promise<any> {
        const response: any = {
            data: {
                type: this.type,
                attributes: {}
            },
            meta: {
            }
        };

        if (state.id !== undefined) {
            response.data.id = state.id;
        } else if (this._id !== undefined) {
            response.data.id = this._id;
        }

        return response;
    }

    protected async _getChildren<T extends DataInterface, Routes>(
        type: DataClassInterface<T, Routes>,
        maxResults?: number
    ): Promise<T[]> {
        return this._getRelatedList(type, undefined, maxResults)
            .then((list: T[]) => {
                this._children.set(type, list);

                return list;
            });
    }

    protected async _getChild<T extends DataInterface, Routes>(
        type: DataClassInterface<T, Routes>
    ): Promise<T> {
        const response = this._children.get(type);

        if (response !== undefined)
            return response as T;

        return this._getRelatedSingle(type)
            .then((child: T) => {
                this._children.set(type, child);

                return child;
            });
    }

    getLink(type: string): string|undefined {
        return this._data?.links[type];
    }

    getRelationshipLink(
        type: DataType
    ): string|undefined {
        return this?._data?.relationships[type]?.links?.related;
    }

    protected async _getRelatedSingle<T extends DataInterface, Routes>(
        className: DataClassInterface<T, Routes>,
        cache?: CacheExpiration,
    ): Promise<T>{
        let name = className.name.toLowerCase();
        if (name[0] === "_")
            name = name.substr(1);

        if (this._data.relationships[name] === undefined)
            throw new Error(className.name + ' missing');

        const url: string|undefined = this._data.relationships[name].links.related;

        if (url === undefined)
            throw new Error(className.name + ' missing');

        // const response = await this._api.getSingle(className, undefined, url, cache ?? className.cacheExpiration);
        const response: T = await api.getSingle(className, url.split('/').pop() ?? "", url, cache ?? className.cacheExpiration);

        if (response === undefined)
            throw new Error(className.name + ' missing');

        return response;
    }

    protected async _getRelatedList<T extends DataInterface, Routes>(
        className: DataClassInterface<T, Routes>,
        cache?: CacheExpiration,
        maxResults?: number
    ): Promise<T[]> {
        let name = className.name.toLowerCase();
        if (name[0] === "_")
            name = name.substr(1);

        const url: string|undefined = this._data.relationships[Pluraliser.plural(name)].links.related;

        if (url === undefined)
            throw new Error(Pluraliser.plural(className.name) + ' missing');

        return api.getList(className, url, cache ?? className.cacheExpiration, maxResults);
    }

    async loadSpecificRelationships(
        relationshipsToLoad?: Array<keyof this>,
        maxResult?: number,
    ): Promise<void> {
        if (relationshipsToLoad === undefined)
            return;

        const promises = relationshipsToLoad.map((methodName: keyof this) => {
            const method = this[methodName];
            if (typeof method === 'function') {
                return method.call(this, maxResult);
            }
        });

        await Promise.all(promises);
    }
}