export const requireData = <T>(data: T | undefined): T => {
    if (data === undefined) {
        throw new Error('Empty response');
    }
    return data;
};

export type PagingParams = {
    page?: number;
    size?: number;
};

export type PagingSortParams = PagingParams & {
    sort?: string;
};

export type SearchParams = {
    q: string;
    type?: string;
    limit?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const normalizePaging = (
    pageOrParams?: number | PagingParams,
    size?: number
): PagingParams => {
    if (typeof pageOrParams === 'number' || typeof size === 'number') {
        return {
            page: typeof pageOrParams === 'number' ? pageOrParams : undefined,
            size,
        };
    }

    if (isRecord(pageOrParams)) {
        return {
            page: pageOrParams.page as number | undefined,
            size: pageOrParams.size as number | undefined,
        };
    }

    return {};
};

export const normalizePagingSort = (
    paramsOrPage?: number | PagingSortParams,
    size?: number,
    sort?: string
): PagingSortParams => {
    if (
        typeof paramsOrPage === 'number' ||
        typeof size === 'number' ||
        typeof sort === 'string'
    ) {
        return {
            page: typeof paramsOrPage === 'number' ? paramsOrPage : undefined,
            size,
            sort,
        };
    }

    if (isRecord(paramsOrPage)) {
        return {
            page: paramsOrPage.page as number | undefined,
            size: paramsOrPage.size as number | undefined,
            sort: paramsOrPage.sort as string | undefined,
        };
    }

    return {};
};

export const normalizeSearch = (
    qOrParams: string | SearchParams,
    type?: string,
    limit?: number
): SearchParams => {
    if (typeof qOrParams === 'string') {
        return { q: qOrParams, type, limit };
    }

    return qOrParams;
};