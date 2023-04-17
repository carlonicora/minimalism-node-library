import {RequestHandlerInterface} from "./interfaces/RequestHandlerInterface";
import {LinkRouter} from "./routing/LinkRouter";
import {ApiCache} from "./cache/ApiCache";
import {RequestHandler} from "./requestHandler/RequestHandler";
import {UserManagementInterface} from "./interfaces/UserManagementInterface";
import {UserManagement} from "./users/UserManagement";

export class Minimalism {
    private static _api: RequestHandlerInterface;
    private static _linkRouter: LinkRouter;
    private static _cache: ApiCache;
    private static _userManager: UserManagementInterface;
    private static _authUrl: string;

    static init(
        apiUrl: string,
        authUrl: string,
        authClientId: string,
    ): void {
        Minimalism._api = new RequestHandler(apiUrl);
        Minimalism._userManager = new UserManagement(authUrl, authClientId);
        Minimalism._linkRouter = new LinkRouter(apiUrl);
        Minimalism._cache = new ApiCache();

        Minimalism._authUrl = authUrl + "auth/index?client_id=" + authClientId + "&state=";
    }

    static get authUrl(): string {
        return Minimalism._authUrl;
    }

    static get api(): RequestHandlerInterface {
        return Minimalism._api;
    }

    static get userManager(): UserManagementInterface {
        return Minimalism._userManager;
    }

    static get linkRouter(): LinkRouter {
        return Minimalism._linkRouter;
    }

    static get cache(): ApiCache {
        return Minimalism._cache;
    }
}