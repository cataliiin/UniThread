import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

// Since the schema might be outdated, we define the types locally or cast to any
export type CommentResponse = {
	id: string;
	post_id: string;
	author_id: string | null;
	body: string;
	created_at: string;
	updated_at: string | null;
	author?: components['schemas']['UserPublic'] | null;
};

export type CommentCreate = {
	body: string;
};

export const CommentsService = {
	async listComments(postId: string): Promise<CommentResponse[]> {
		const { data } = await api.GET('/api/v1/posts/{post_id}/comments' as any, {
			params: { path: { post_id: postId } }
		});
		return requireData(data as any);
	},

	async createComment(postId: string, payload: CommentCreate): Promise<CommentResponse> {
		const { data } = await api.POST('/api/v1/posts/{post_id}/comments' as any, {
			params: { path: { post_id: postId } },
			body: payload as any
		});
		return requireData(data as any);
	},

	async deleteComment(postId: string, commentId: string): Promise<void> {
		await api.DELETE('/api/v1/posts/{post_id}/comments/{comment_id}' as any, {
			params: { path: { post_id: postId, comment_id: commentId } }
		});
	}
};
