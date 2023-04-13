import {RoutingTypeInterface} from "../interfaces/RoutingTypeInterface";

export class Routing {
    private _routingMap: Map<number, RoutingTypeInterface>;

    constructor() {
        this._routingMap = new Map<number, RoutingTypeInterface>();
    }

    add(key: number, value: RoutingTypeInterface): void {
        this._routingMap.set(key, value);
    }

    get(key: number): RoutingTypeInterface {
        const response = this._routingMap.get(key);

        if (response === undefined)
            throw new Error("");

        return response;
    }

    link(key:number): string {
        const response = this._routingMap.get(key);

        if(response === undefined || response.url === undefined)
            throw new Error("");

        return response.url;
    }
}