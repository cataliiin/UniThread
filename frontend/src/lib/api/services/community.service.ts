import { api } from '../client';
import type { components } from '../schema';

type PaginatedCommunities = components["schemas"]["PaginatedResponse_CommunityResponse_"];
type CommunityResponse = components["schemas"]["CommunityResponse"];
type CommunityCreate = components["schemas"]["CommunityCreate"];
type CommunityJoinRequestSchema = components["schemas"]["CommunityJoinRequestSchema"];
type CommunityMemberResponse = components["schemas"]["CommunityMemberResponse"];

export const CommunityService = {
	async list(page: number = 1, size: number = 20, customFetch?: typeof fetch): Promise<PaginatedCommunities> {
		const { data, error } = await api.GET('/api/v1/communities', {
			params: { query: { page, size } },
			fetch: customFetch
		});

		if (error) throw new Error('Error fetching communities');
		return data as PaginatedCommunities;
	},

	async get(communityId: string, customFetch?: typeof fetch): Promise<CommunityResponse> {
		const { data, error } = await api.GET('/api/v1/communities/{community_id}', {
			params: { path: { community_id: communityId } },
			fetch: customFetch
		});

		if (error) throw new Error('Community not found');
		return data as CommunityResponse;
	},

	async create(payload: CommunityCreate, customFetch?: typeof fetch): Promise<CommunityResponse> {
		const { data, error } = await api.POST('/api/v1/communities', {
			body: payload,
			fetch: customFetch
		});

		if (error) {
			throw new Error(
				typeof error.detail === 'string'
					? error.detail
					: 'Error creating community'
			);
		}
		return data as CommunityResponse;
	},

	async join(communityId: string, answers?: CommunityJoinRequestSchema, customFetch?: typeof fetch): Promise<CommunityMemberResponse> {
		const { data, error } = await api.POST('/api/v1/communities/{community_id}/join', {
			params: { path: { community_id: communityId } },
			body: answers || null,
			fetch: customFetch
		});

		if (error) {
			throw new Error(
				typeof error.detail === 'string'
					? error.detail
					: 'Error joining community'
			);
		}
		return data as CommunityMemberResponse;
	},

	async leave(communityId: string, customFetch?: typeof fetch): Promise<void> {
		const { error } = await api.POST('/api/v1/communities/{community_id}/leave', {
			params: { path: { community_id: communityId } },
			fetch: customFetch
		});

		if (error) throw new Error('Could not leave community');
	}
};
