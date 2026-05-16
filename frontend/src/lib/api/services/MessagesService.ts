import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

export type MessageResponse = components['schemas']['MessageResponse'];
export type MessageCreate = components['schemas']['MessageCreate'];
export type PaginatedMessageResponse = components['schemas']['PaginatedResponse_MessageResponse_'];

export const MessagesService = {
	async listRecentConversations(): Promise<MessageResponse[]> {
		const { data } = await api.GET('/api/v1/messages');
		return requireData(data);
	},

	async getMessageHistory(otherUserId: string, page = 1, size = 50): Promise<PaginatedMessageResponse> {
		const { data } = await api.GET('/api/v1/messages/{other_user_id}', {
			params: {
				path: { other_user_id: otherUserId },
				query: { page, size }
			}
		});
		return requireData(data);
	},

	async createMessage(recipientId: string, payload: MessageCreate): Promise<MessageResponse> {
		const { data } = await api.POST('/api/v1/messages/{recipient_id}', {
			params: { path: { recipient_id: recipientId } },
			body: payload
		});
		return requireData(data);
	}
};
