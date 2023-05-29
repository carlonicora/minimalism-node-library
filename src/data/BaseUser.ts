import {AbstractData} from "../abstracts/AbstractData";
import {BaseUserInterface} from "../interfaces/BaseUserInterface";
import {DataClassInterface} from "../interfaces/DataClassInterface";
import {BaseRoutes} from "../enums/BaseRoutes";
import {CacheExpiration} from "../enums/CacheExpiration";
import {DataInterface} from "../interfaces/DataInterface";

class _BaseUser extends AbstractData implements BaseUserInterface {
    private _email: string | undefined;

    importData(data: any) {
        super.importData(data);

        this._email = data.attributes.email;
    }

    get email(): string | undefined {
        return this._email;
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const BaseUser: DataClassInterface<BaseUserInterface, BaseRoutes> = Object.assign(_BaseUser, {
    cacheExpiration: CacheExpiration.NoCache,
    route: BaseRoutes.user,
});