import Cookies from "universal-cookie";
import {DataFactory} from "../factories/DataFactory";
import {UserManagementInterface} from "../interfaces/UserManagementInterface";
import {BaseUserInterface} from "../interfaces/BaseUserInterface";
import {DataClassInterface} from "../interfaces/DataClassInterface";
import {Minimalism} from "../Minimalism";

const cookies = new Cookies();

export class UserManagement<T extends BaseUserInterface = BaseUserInterface, Routes extends keyof any = keyof any> implements UserManagementInterface{
    private _token: string|undefined;
    private _refreshToken: string|undefined;
    private _tokenExpires: number|undefined;

    private _userData: any|undefined;
    private _user: T|undefined;

    constructor(
        private _authUrl: string,
        private _authClientId: string,
    ) {
        this._token = cookies.get('token');
        this._refreshToken = cookies.get('refresh_token');
        this._tokenExpires = +cookies.get('token_expires');

        if (this._token === "undefined"){
            cookies.remove('token');
            cookies.remove('refresh_token');
            cookies.remove('token_expires');
            cookies.remove('user');
        }
    }

    logout(): void {
        cookies.remove('token');
        cookies.remove('refresh_token');
        cookies.remove('token_expires');
        cookies.remove('user');
    }

    private _login(token: any): void {
        if (token.access_token === undefined)
            return;

        const durationInSeconds = 365 * 24 * 60 * 60;
        const options = {
            path: "/",
            maxAge: durationInSeconds,
            expires: new Date(Date.now() + durationInSeconds * 1000),
        };
        cookies.set("token", token.access_token,  options);
        cookies.set("refresh_token", token.refresh_token, options);
        cookies.set("token_expires", +(token.expires * 1000), options);
    }

    private async _retrieveToken(
        data: any,
    ): Promise<any> {
        const url: string = this._authUrl + "token";

        return fetch(url,{
            method: "POST",
            body: JSON.stringify(data),
            mode: "cors",
            cache: "no-cache",
        })
            .then((response: Response) => {
                return response.json()
                    .then((token: any) => {
                        this._login(token);
                        return;
                    })
                    .catch((error: any) => {
                        return;
                    });
            });
    }

    async getToken(
        code: string,
    ): Promise<void> {
        const data: any = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": this._authClientId,
        };

        return this._retrieveToken(data);
    }

    private async _getRefreshToken(): Promise<void> {
        const data: any = {
            "grant_type": "refresh_token",
            "refresh_token": this._refreshToken,
            "client_id": this._authClientId,
        };

        return this._retrieveToken(data);
    }

    async initialise(userClass: DataClassInterface<T, Routes>): Promise<void> {
        const cookies = new Cookies();

        if (this._token !== undefined) {
            if (this._tokenExpires !== undefined){
                const tokenExpirationTimeUTC = new Date(this._tokenExpires);
                const now = new Date();
                if (tokenExpirationTimeUTC < now) {
                    await this._getRefreshToken();
                }
            }

            this._userData = cookies.get("user");

            if (this._userData !== undefined) {
                this._user = DataFactory.create(userClass, this._userData);
            } else {
                try {
                    this._user = await Minimalism.api.getSingle(userClass, "me");
                    this._userData = this._user.data;
                    cookies.set("user", this._userData, { path: "/" });
                } catch (e) {
                    console.log(e);

                    this._userData = undefined;
                    this._user = undefined;
                    this._token = undefined;
                    this.logout();
                }
            }
        }

        if (this._user !== undefined)
            await this._user.load();

    }

    set user(value: T) {
        this._user = value;
        this._userData = this._user.data;
        cookies.set("user", this._userData, { path: "/" });
    }

    get isLoggedIn(): boolean {
        return this._token !== undefined && this._user !== undefined;
    }

    get token(): string|undefined {
        return this._token;
    }

    get user(): T {
        if (this._user === undefined)
            throw new Error("User is not logged in");

        return this._user;
    }
}