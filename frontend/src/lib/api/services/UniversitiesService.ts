import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { normalizePaging, requireData } from '$lib/api/services/helpers';
import type { PagingParams } from '$lib/api/services/helpers';

type PaginatedUniversities = components['schemas']['PaginatedResponse_UniversityResponse_'];
type UniversityResponse = components['schemas']['UniversityResponse'];

export const UniversitiesService = {
	async list(pageOrParams?: number | PagingParams, size?: number): Promise<PaginatedUniversities> {
		const paging = normalizePaging(pageOrParams, size);
		const { data } = await api.GET('/api/v1/universities', {
			params: { query: { page: paging.page, size: paging.size } },
		});
		return requireData(data);
	},

	async get(universityId: string): Promise<UniversityResponse> {
		const { data } = await api.GET('/api/v1/universities/{university_id}', {
			params: { path: { university_id: universityId } },
		});
		return requireData(data);
	},
};
