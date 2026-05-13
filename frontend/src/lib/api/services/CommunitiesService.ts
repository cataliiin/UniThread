import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { normalizePaging, normalizePagingSort, requireData } from '$lib/api/services/helpers';
import type { PagingParams, PagingSortParams } from '$lib/api/services/helpers';

type CommunityCreate = components['schemas']['CommunityCreate'];
type CommunityUpdate = components['schemas']['CommunityUpdate'];
type CommunityResponse = components['schemas']['CommunityResponse'];
type CommunityMemberResponse = components['schemas']['CommunityMemberResponse'];
type CommunityJoinRequestSchema = components['schemas']['CommunityJoinRequestSchema'];
type PaginatedCommunities = components['schemas']['PaginatedResponse_CommunityResponse_'];
type PaginatedPosts = components['schemas']['PaginatedResponse_PostFeedResponse_'];
type PaginatedMembers = components['schemas']['PaginatedResponse_UserPublic_'];
type UserPublic = components['schemas']['UserPublic'];
type TransferOwnershipRequest = components['schemas']['TransferOwnershipRequest'];

export const CommunitiesService = {
	async list(pageOrParams?: number | PagingParams, size?: number): Promise<PaginatedCommunities> {
		const paging = normalizePaging(pageOrParams, size);
		const { data } = await api.GET('/api/v1/communities', {
			params: { query: { page: paging.page, size: paging.size } },
		});
		return requireData(data);
	},

	async create(payload: CommunityCreate): Promise<CommunityResponse> {
		const { data } = await api.POST('/api/v1/communities', { body: payload });
		return requireData(data);
	},

	async get(communityId: string): Promise<CommunityResponse> {
		const { data } = await api.GET('/api/v1/communities/{community_id}', {
			params: { path: { community_id: communityId } },
		});
		return requireData(data);
	},

	async update(
		communityIdOrParams: string | { communityId: string; payload: CommunityUpdate },
		payload?: CommunityUpdate
	): Promise<CommunityResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const body =
			typeof communityIdOrParams === 'string' ? payload : communityIdOrParams.payload;
		if (!body) {
			throw new Error('payload is required');
		}
		const { data } = await api.PATCH('/api/v1/communities/{community_id}', {
			params: { path: { community_id: communityId } },
			body,
		});
		return requireData(data);
	},

	async remove(communityId: string): Promise<void> {
		await api.DELETE('/api/v1/communities/{community_id}', {
			params: { path: { community_id: communityId } },
		});
	},

	async getPosts(
		communityIdOrParams:
			| string
			| ({ communityId: string } & PagingSortParams),
		page?: number,
		size?: number,
		sort?: string
	): Promise<PaginatedPosts> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const paging =
			typeof communityIdOrParams === 'string'
				? normalizePagingSort(page, size, sort)
				: normalizePagingSort(communityIdOrParams);
		const { data } = await api.GET('/api/v1/communities/{community_id}/posts', {
			params: {
				path: { community_id: communityId },
				query: { page: paging.page, size: paging.size, sort: paging.sort },
			},
		});
		return requireData(data);
	},

	async listMembers(
		communityIdOrParams:
			| string
			| ({ communityId: string } & PagingParams),
		page?: number,
		size?: number
	): Promise<PaginatedMembers> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const paging =
			typeof communityIdOrParams === 'string'
				? normalizePaging(page, size)
				: normalizePaging(communityIdOrParams);
		const { data } = await api.GET('/api/v1/communities/{community_id}/members', {
			params: {
				path: { community_id: communityId },
				query: { page: paging.page, size: paging.size },
			},
		});
		return requireData(data);
	},

	async join(
		communityIdOrParams:
			| string
			| { communityId: string; payload?: CommunityJoinRequestSchema | null },
		payload?: CommunityJoinRequestSchema | null
	): Promise<CommunityMemberResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const body =
			typeof communityIdOrParams === 'string'
				? payload
				: communityIdOrParams.payload;
		const request =
			body === undefined
				? { params: { path: { community_id: communityId } } }
				: { params: { path: { community_id: communityId } }, body };
		const { data } = await api.POST('/api/v1/communities/{community_id}/join', request);
		return requireData(data);
	},

	async leave(communityId: string): Promise<void> {
		await api.POST('/api/v1/communities/{community_id}/leave', {
			params: { path: { community_id: communityId } },
		});
	},

	async listAdmins(communityId: string): Promise<UserPublic[]> {
		const { data } = await api.GET('/api/v1/communities/{community_id}/admins', {
			params: { path: { community_id: communityId } },
		});
		return requireData(data);
	},

	async transferOwnership(
		communityIdOrParams: string | { communityId: string; newOwnerId: string },
		newOwnerId?: string
	): Promise<CommunityResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const targetOwnerId =
			typeof communityIdOrParams === 'string'
				? newOwnerId
				: communityIdOrParams.newOwnerId;
		if (!targetOwnerId) {
			throw new Error('newOwnerId is required');
		}
		const payload: TransferOwnershipRequest = { new_owner_id: targetOwnerId };
		const { data } = await api.POST('/api/v1/communities/{community_id}/transfer-ownership', {
			params: { path: { community_id: communityId } },
			body: payload,
		});
		return requireData(data);
	},
};
