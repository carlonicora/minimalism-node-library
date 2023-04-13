import {DataInterface} from "./DataInterface";

export interface BaseUserInterface extends DataInterface {
    get email(): string | undefined;
}