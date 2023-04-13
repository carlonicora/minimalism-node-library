import {RoutingTypeInterface} from "../interfaces/RoutingTypeInterface";

export class LinkRouter {
    static getLink(
        route?: RoutingTypeInterface,
        id?: string,
        childId?: string,
    ): string {
        if (route === undefined)
            throw new Error('');

        if (route.url === undefined)
            throw new Error('');

        if (id === undefined)
            return route.url;

        return this._generateUri(route.url, id, childId);
    }

    static getApiEndpoint(
        route?: RoutingTypeInterface,
        id?: string,
        childId?: string,
    ): string {
        if (route === undefined)
            throw new Error("");

        if (route.endpoint === undefined)
            throw new Error("Route not identifying of an API endpoint");

        let response: string|undefined = process.env.REACT_APP_API_URL;

        if (response === undefined)
            throw new Error("API url not defined");

        if (!response.endsWith("/"))
            response += "/";

        response += this._identifyApiVersion(route.version);
        response += this._generateUri(route.endpoint, id, childId);

        return response;
    }

    private static _identifyApiVersion(
        version?: number,
    ): string {
        if (version === undefined)
            throw new Error("Missing API version");

        const strVersion = version.toString();
        const formattedNum = strVersion.includes('.') ? strVersion : strVersion + ".0";

        return "v" + formattedNum;
    }

    private static _generateUri(
        route: string,
        id?: string,
        childId?: string,
    ): string {let response = "";
        let parentIdUsed = false;

        const routeElements = route.split("/");

        for (let index=0; index<routeElements.length; index++){
            if (routeElements[index] === "")
                continue;

            if (!response.endsWith("/"))
                response += "/";

            if (routeElements[index][0] === ":") {
                if (!parentIdUsed) {
                    parentIdUsed = true;
                    if (id !== undefined) {
                        response += id;
                    }
                } else if (childId !== undefined){
                    response += childId;
                } else {
                    throw new Error("");
                }
            }else {
                response += routeElements[index];
            }
        }

        return response;
    }
}