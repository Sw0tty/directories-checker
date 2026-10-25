export type Response<T = any> = {
    ok: boolean;
    data?: T;
    error?: NodeJS.ErrnoException | string;
}
