import {BaseUserInterface} from "./BaseUserInterface";
import {DataClassInterface} from "./DataClassInterface";

export interface UserManagementInterface<T extends BaseUserInterface = BaseUserInterface, R extends keyof any = keyof any> {
    initialise(userClass: DataClassInterface<T, R>): Promise<void>;
    getToken(code: string): Promise<void>;
    get isLoggedIn(): boolean;
    get user(): T;
    set user(value: T);
    get token(): string|undefined;
    logout(): void;
}