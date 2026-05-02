import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { normalizeSearch, requireData } from '$lib/api/services/helpers';
import type { SearchParams } from '$lib/api/services/helpers';

type GlobalSearchResponse = components['schemas']['GlobalSearchResponse'];

export const SearchService = {
    async globalSearch(
        qOrParams: string | SearchParams,
        type?: string,
        limit?: number
    ): Promise<GlobalSearchResponse> {
        const params = normalizeSearch(qOrParams, type, limit);
        const { data } = await api.GET('/api/v1/search', {
            params: { query: { q: params.q, type: params.type, limit: params.limit } },
        });
        return requireData(data);
    },
};