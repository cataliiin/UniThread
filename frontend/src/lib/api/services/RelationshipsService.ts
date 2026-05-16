import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

export type BlockedUserResponse = components['schemas']['BlockedUserResponse'];
export type PaginatedBlockedUserResponse = components['schemas']['PaginatedResponse_BlockedUserResponse_'];

export const RelationshipsService = {
	async listBlockedUsers(page = 1, size = 20): Promise<PaginatedBlockedUserResponse> {
		const { data } = await api.GET('/api/v1/relationships/blocked', {
			params: {
				query: { page, size }
			}
		});
		return requireData(data);
	},

	async blockUser(targetId: string): Promise<void> {
		await api.POST('/api/v1/relationships/{target_id}/block', {
			params: { path: { target_id: targetId } }
		});
	},

	async unblockUser(targetId: string): Promise<void> {
		await api.DELETE('/api/v1/relationships/{target_id}/block', {
			params: { path: { target_id: targetId } }
		});
	},

	async muteUser(targetId: string): Promise<void> {
		await api.POST('/api/v1/relationships/{target_id}/mute', {
			params: { path: { target_id: targetId } }
		});
	},

	async unmuteUser(targetId: string): Promise<void> {
		await api.DELETE('/api/v1/relationships/{target_id}/mute', {
			params: { path: { target_id: targetId } }
		});
	}
};
