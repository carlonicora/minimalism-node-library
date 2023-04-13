export class Pluraliser {
    static singular(
        name: string,
    ): string {
        let response: string = name;

        if (name.toLowerCase().substring(name.length - 3) === 'ies')
            response = name.substring(0, name.length - 3) + 'y';
        else if (name.toLowerCase().substring(name.length - 4) === 'sses')
            response = name.substring(0, name.length - 2);
        else if (name.toLowerCase().substring(name.length - 3) === 'ses' || name.substring(name.length - 1) === 's')
            response = name.substring(0, name.length - 1);

        return response;
    }

    static plural(
        name: string,
    ): string {
        let response: string = name;

        if (name.toLowerCase().substring(name.length - 1) === 'y')
            response = response.substring(0, name.length - 1) + "ies";
        else if (name.toLowerCase().substring(name.length - 1) !== 's')
            response += "s";

        return response;
    }
}