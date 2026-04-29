import { api } from '../client';
import type { components } from '../schema';

type PaginatedPosts = components["schemas"]["PaginatedResponse_PostFeedResponse_"];
type PostResponse = components["schemas"]["PostResponse"];
type PostFeedResponse = components["schemas"]["PostFeedResponse"];
type PostCreate = components["schemas"]["PostCreate"];
type VoteCreate = components["schemas"]["VoteCreate"];

export const PostService = {
	async getGlobalFeed(page: number = 1, size: number = 20, sort: 'new' | 'top' = 'new', customFetch?: typeof fetch): Promise<PaginatedPosts> {
		const { data, error } = await api.GET('/api/v1/posts', {
			params: { query: { page, size, sort } },
			fetch: customFetch
		});

		if (error) throw new Error('Error fetching global posts');
		return data as PaginatedPosts;
	},

	async getCommunityFeed(communityId: string, page: number = 1, size: number = 20, sort: 'new' | 'top' = 'new', customFetch?: typeof fetch): Promise<PaginatedPosts> {
		const { data, error } = await api.GET('/api/v1/communities/{community_id}/posts', {
			params: { path: { community_id: communityId }, query: { page, size, sort } },
			fetch: customFetch
		});

		if (error) throw new Error('Error fetching community posts');
		return data as PaginatedPosts;
	},

	async get(postId: string, customFetch?: typeof fetch): Promise<PostFeedResponse> {
		const { data, error } = await api.GET('/api/v1/posts/{post_id}', {
			params: { path: { post_id: postId } },
			fetch: customFetch
		});

		if (error) throw new Error('Post not found');
		return data as PostFeedResponse;
	},

	async create(payload: PostCreate, customFetch?: typeof fetch): Promise<PostResponse> {
		const { data, error } = await api.POST('/api/v1/posts', {
			body: payload,
			fetch: customFetch
		});

		if (error) {
			throw new Error(
				typeof error.detail === 'string'
					? error.detail
					: 'Error creating post'
			);
		}
		return data as PostResponse;
	},

	async vote(postId: string, value: 1 | 0 | -1, customFetch?: typeof fetch): Promise<PostFeedResponse> {
		const payload: VoteCreate = { value };
		const { data, error } = await api.POST('/api/v1/posts/{post_id}/vote', {
			params: { path: { post_id: postId } },
			body: payload,
			fetch: customFetch
		});

		if (error) throw new Error('Error saving vote');
		return data as PostFeedResponse;
	}
};
