import {useCallback, useEffect, useState} from "react";
import {DataInterface} from "../interfaces/DataInterface";
import {LoadedDataInterface} from "../interfaces/LoadedDataInterface";
import {DataClassInterface} from "../interfaces/DataClassInterface";
import {Minimalism} from "../Minimalism";

function areMapsEqual(
    map1: Map<string, string> | undefined,
    map2: Map<string, string> | undefined,
): boolean {
    if (map1 === undefined && map2 === undefined)
        return true;

    if (map1 === undefined || map2 === undefined)
        return false;

    if (map1.size !== map2.size)
        return false;

    for (const [key, value] of map1) {
        if (map2.get(key) !== value)
            return false;

    }

    return true;
}
export function useListLoader<T extends DataInterface, Routes>(
    objectClass: DataClassInterface<T, Routes>,
    run: boolean,
    searchParams?: Map<string, string>,
    maxResults?: number,
): LoadedDataInterface {
    const [isLoaded, setIsLoaded] = useState(false);
    const [data, setData] = useState<T[]>([]);
    const [usedSearchParams, setUsedSearchParams] = useState<Map<string, string> | undefined>(undefined);

    const isLoadingRelationships = false;

    const reloadData = useCallback(() => {
        setData([]);
        setIsLoaded(false);
    }, []);

    useEffect(() => {
        async function fetchData() {
            const data = await Minimalism.api.getList(objectClass, undefined, undefined, maxResults ?? 10, searchParams);
            setIsLoaded(true);
            setData(data);
            setUsedSearchParams(searchParams);
        }

        if (!areMapsEqual(usedSearchParams, searchParams))
            setIsLoaded(false);

        if (!isLoaded && run) {
            fetchData();
        }
    }, [objectClass, run, searchParams, maxResults]);

    return {isLoaded, data, reloadData, isLoadingRelationships};
}