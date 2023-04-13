import Cookies from "universal-cookie";
import {DataFactory} from "../factories/DataFactory";
import {UserManagementInterface} from "../interfaces/UserManagementInterface";
import {api} from "../init";
import {BaseUserInterface} from "../interfaces/BaseUserInterface";
import {DataClassInterface} from "../interfaces/DataClassInterface";

export class UserManagement<T extends BaseUserInterface = BaseUserInterface, Routes extends keyof any = keyof any> implements UserManagementInterface{
    private _token: string|undefined;
    private _refreshToken: string|undefined;
    private _tokenExpires: number|undefined;

    private _userData: any|undefined;
    private _user: T|undefined;

    constructor() {
        const cookies = new Cookies();

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
        const cookies = new Cookies();
        cookies.remove('token');
        cookies.remove('refresh_token');
        cookies.remove('token_expires');
        cookies.remove('user');
    }

    private _login(token: any): void {
        if (token.access_token === undefined)
            return;

        const cookies = new Cookies();
        cookies.set("token", token.access_token);
        cookies.set("refresh_token", token.refresh_token);
        cookies.set("token_expires", +(token.expires * 1000));
    }

    private async _retrieveToken(
        data: any,
    ): Promise<any> {
        const url: string = process.env.REACT_APP_AUTH_URL + "token";

        return fetch(url,{
            method: "POST",
            body: JSON.stringify(data),
            mode: "cors",
            cache: "no-cache",
        })
            .then((response: Response) => {
                response.json()
                    .then((token: any) => {
                        this._login(token);

                        return;
                    })
                    .catch((error: any) => {
                        console.log(error);

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
            "client_id": process.env.REACT_APP_AUTH_CLIENT_ID,
        };

        return this._retrieveToken(data);
    }

    private async _getRefreshToken(): Promise<void> {
        const data: any = {
            "grant_type": "refresh_token",
            "refresh_token": this._refreshToken,
            "client_id": process.env.REACT_APP_AUTH_CLIENT_ID,
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
                    this._user = await api.getSingle(userClass, "me");
                    this._userData = this._user.data;
                    cookies.set("user", this._userData);
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

    get isLoggedIn(): boolean {
        return this._token !== undefined && this._user !== undefined;
    }

    get token(): string|undefined {
        return this._token;
    }

    get user(): T|undefined {
        return this._user;
    }
}