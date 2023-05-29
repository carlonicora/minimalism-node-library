import {useState, useEffect, useRef, useCallback} from 'react';
import {DataInterface} from "../interfaces/DataInterface";
import {DataClassInterface} from "../interfaces/DataClassInterface";
import {LoadedDataInterface} from "../interfaces/LoadedDataInterface";
import {Minimalism} from "../Minimalism";
import {useRouter} from "next/router";

export function useDataLoader<T extends DataInterface, Routes>(
    objectClass: DataClassInterface<T, Routes>,
    initialData?: T,
    relationshipsToLoad?: Array<keyof T>,
    maxResults?: number,
    useIdFromRouter?: boolean,
): LoadedDataInterface {
    const router = useRouter();
    const { id } = router.query as { id: string | undefined };

    const [skipCache, setSkipCache] = useState(false);
    const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [data, setData] = useState(initialData);
    const dataRef = useRef(initialData);

    const reloadData = useCallback((refreshCache?: boolean) => {
        if (id !== undefined && useIdFromRouter) {
            dataRef.current = undefined;
        }
        setData(dataRef.current);
        if (refreshCache)
            setSkipCache(true);

        setIsLoaded(false);
    }, [id]);

    useEffect(() => {
        if (initialData === undefined) {
            dataRef.current = undefined;
            reloadData();
        } else {
            dataRef.current = initialData;
            reloadData();
        }
    }, [initialData, reloadData]);

    useEffect(() => {
        async function fetchData() {
            let localData = dataRef.current;

            if (id !== undefined &&  useIdFromRouter && localData === undefined) {
                localData = await Minimalism.api.getSingle(objectClass, id, undefined, undefined, skipCache);
            }

            if (relationshipsToLoad !== undefined && localData !== undefined) {
                setIsLoadingRelationships(true);
                await localData.loadSpecificRelationships(relationshipsToLoad, maxResults);
                setIsLoadingRelationships(false);
            }

            dataRef.current = localData;

            if (skipCache)
                setSkipCache(false);

            setData(localData);
            setIsLoaded(true);
        }

        if (!isLoaded) {
            fetchData();
        }
    }, [id, objectClass, maxResults, relationshipsToLoad, isLoaded, useIdFromRouter, skipCache]);

    return { isLoaded, data, reloadData, isLoadingRelationships };
}