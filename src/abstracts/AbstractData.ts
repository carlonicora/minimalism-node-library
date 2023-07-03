import {DataType} from "../enums/DataType";
import {DataInterface} from "../interfaces/DataInterface";
import {DataClassInterface} from "../interfaces/DataClassInterface";
import {CacheExpiration} from "../enums/CacheExpiration";
import {Pluraliser} from "../utils/Pluraliser";
import {Minimalism} from "../Minimalism";

export abstract class AbstractData implements DataInterface{
    private _type: string;
    private _id: string|undefined;

    protected _data: any;
    protected _included?: any[];
    protected _children: Map<DataClassInterface<any, any>, DataInterface|DataInterface[]> = new Map<DataClassInterface<any, any>, DataInterface[]>();

    constructor(type: string) {
        this._type = type;
    }

    importData(
        data: any,
        includedData?: any[],
    ): void {
        this._data = data;
        this._included = includedData;
        this._type = data.type;
        this._id = data.id;
    }

    protected _addIncluded<T extends DataInterface, Routes>(
        type: DataClassInterface<T, Routes>,
        name: string,
        isSingle: boolean = false,
    ): void {
        if (this._data.relationships[name] !== undefined) {
            const items = Array.isArray(this._data.relationships[name].data) ? this._data.relationships[name].data : [this._data.relationships[name].data];

            const resourceObjects = items.map((item: any) => {
                if (item === undefined)
                    return undefined;

                const includedItem = (this._included || []).find((includedElement: any) => includedElement.type === item.type && includedElement.id === item.id);

                if (includedItem) {
                    const resourceObject = new type(includedItem.id);
                    resourceObject.importData(includedItem, this._included);
                    return resourceObject;
                }

                return undefined;
            });

            const allItems = resourceObjects.filter((item: any|undefined) => item !== undefined);

            if (allItems.length !== 0){
                if (isSingle){
                    this._children.set(type, allItems[0]);
                } else {
                    this._children.set(type, allItems);
                }
            } else {
                if (!isSingle){
                    this._children.set(type, []);
                }
            }
        }
    }

    cleanChildren<T extends DataInterface, Routes>(type?: DataClassInterface<T, Routes>,): void {
        if (type === undefined)
            this._children.clear();
        else
            this._children.delete(type);

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

    get included(): any[] | undefined {
        return this._included;
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
        if (this._children.has(type))
            return this._children.get(type) as T[];

        return this._getRelatedList(type, undefined, maxResults)
            .then((list: T[]) => {
                this._children.set(type, list);

                return list;
            });
    }

    protected async _getChild<T extends DataInterface, Routes>(
        type: DataClassInterface<T, Routes>
    ): Promise<T> {
        if (this._children.has(type))
            return this._children.get(type) as T;

        return this._getRelatedSingle(type)
            .then((child: T) => {
                this._children.set(type, child);

                return child;
            });
    }

    getLink(type: string): string|undefined {
        return this._data?.links[type];
    }

    getRelationshipLink<T extends DataInterface, Routes>(
        type: DataClassInterface<T, Routes>,
        plural?: boolean,
    ): string|undefined {
        let name = type.name.toLowerCase();
        if (name[0] === "_")
            name = name.substr(1);

        if (plural)
            name = Pluraliser.plural(name);

        return this?._data?.relationships[name]?.links?.related;
    }

    protected async _getRelatedSingle<T extends DataInterface, Routes>(
        className: DataClassInterface<T, Routes>,
        cache?: CacheExpiration,
    ): Promise<T>{
        let name = className.className.toLowerCase();
        if (name[0] === "_")
            name = name.substr(1);

        if (this._data.relationships[name] === undefined)
            throw new Error(className.className + ' missing');

        const url: string|undefined = this._data.relationships[name].links.related;

        if (url === undefined)
            throw new Error(className.className + ' missing');

        // const response = await this._api.getSingle(className, undefined, url, cache ?? className.cacheExpiration);
        const response: T = await Minimalism.api.getSingle(className, url.split('/').pop() ?? "", url, cache ?? className.cacheExpiration);

        if (response === undefined)
            throw new Error(className.className + ' missing');

        return response;
    }

    protected async _getRelatedList<T extends DataInterface, Routes>(
        className: DataClassInterface<T, Routes>,
        cache?: CacheExpiration,
        maxResults?: number
    ): Promise<T[]> {
        let name = className.className.toLowerCase();
        if (name[0] === "_")
            name = name.substr(1);

        const url: string|undefined = this._data.relationships[Pluraliser.plural(name)].links.related;

        if (url === undefined)
            throw new Error(Pluraliser.plural(className.className) + ' missing');

        return Minimalism.api.getList(className, url, cache ?? className.cacheExpiration, maxResults);
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