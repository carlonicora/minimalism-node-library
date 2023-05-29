export interface LoadedDataInterface {
    isLoaded: boolean,
    data: any,
    reloadData: (refreshCache?: boolean) => void,
    isLoadingRelationships: boolean,
}