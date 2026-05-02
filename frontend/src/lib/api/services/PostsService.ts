import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { normalizePagingSort, requireData } from '$lib/api/services/helpers';
import type { PagingSortParams } from '$lib/api/services/helpers';

type PaginatedPosts = components['schemas']['PaginatedResponse_PostFeedResponse_'];
type PostCreate = components['schemas']['PostCreate'];
type PostUpdate = components['schemas']['PostUpdate'];
type PostFeedResponse = components['schemas']['PostFeedResponse'];
type PostResponse = components['schemas']['PostResponse'];
type VoteCreate = components['schemas']['VoteCreate'];

export const PostsService = {
	async getGlobalFeed(
		paramsOrPage?: number | PagingSortParams,
		size?: number,
		sort?: string
	): Promise<PaginatedPosts> {
		const paging = normalizePagingSort(paramsOrPage, size, sort);
		const { data } = await api.GET('/api/v1/posts', {
			params: { query: { page: paging.page, size: paging.size, sort: paging.sort } },
		});
		return requireData(data);
	},

	async createPost(payload: PostCreate): Promise<PostResponse> {
		const { data } = await api.POST('/api/v1/posts', { body: payload });
		return requireData(data);
	},

	async getPost(postId: string): Promise<PostFeedResponse> {
		const { data } = await api.GET('/api/v1/posts/{post_id}', {
			params: { path: { post_id: postId } },
		});
		return requireData(data);
	},

	async updatePost(
		postIdOrParams: string | { postId: string; payload: PostUpdate },
		payload?: PostUpdate
	): Promise<PostResponse> {
		const postId = typeof postIdOrParams === 'string' ? postIdOrParams : postIdOrParams.postId;
		const body = typeof postIdOrParams === 'string' ? payload : postIdOrParams.payload;
		if (!body) {
			throw new Error('payload is required');
		}
		const { data } = await api.PATCH('/api/v1/posts/{post_id}', {
			params: { path: { post_id: postId } },
			body,
		});
		return requireData(data);
	},

	async deletePost(postIdOrParams: string | { postId: string }): Promise<void> {
		const postId = typeof postIdOrParams === 'string' ? postIdOrParams : postIdOrParams.postId;
		await api.DELETE('/api/v1/posts/{post_id}', {
			params: { path: { post_id: postId } },
		});
	},

	async votePost(
		postIdOrParams: string | { postId: string; value: number },
		value?: number
	): Promise<PostFeedResponse> {
		const postId = typeof postIdOrParams === 'string' ? postIdOrParams : postIdOrParams.postId;
		const scoreValue =
			typeof postIdOrParams === 'string' ? value : postIdOrParams.value;
		if (scoreValue === undefined) {
			throw new Error('value is required');
		}
		const vote: VoteCreate = { value: scoreValue };
		const { data } = await api.POST('/api/v1/posts/{post_id}/vote', {
			params: { path: { post_id: postId } },
			body: vote,
		});
		return requireData(data);
	},
};
