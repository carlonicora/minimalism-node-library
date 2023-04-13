export interface CacheItemInterface<T> {
    key: string;
    value: T;
    timestamp: number | null;
}