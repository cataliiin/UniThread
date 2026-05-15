import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

export type CommentResponse = components['schemas']['CommentResponse'];
export type CommentCreate = components['schemas']['CommentCreate'];

export const CommentsService = {
	async listComments(postId: string): Promise<CommentResponse[]> {
		const { data } = await api.GET('/api/v1/posts/{post_id}/comments', {
			params: { path: { post_id: postId } }
		});
		return requireData(data);
	},

	async createComment(postId: string, payload: CommentCreate): Promise<CommentResponse> {
		const { data } = await api.POST('/api/v1/posts/{post_id}/comments', {
			params: { path: { post_id: postId } },
			body: payload
		});
		return requireData(data);
	},

	async deleteComment(postId: string, commentId: string): Promise<void> {
		await api.DELETE('/api/v1/posts/{post_id}/comments/{comment_id}', {
			params: { path: { post_id: postId, comment_id: commentId } }
		});
	}
};
