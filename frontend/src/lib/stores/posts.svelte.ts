import { type Post, type SortOption, type FeedType } from '$lib/types/post';
import { PostsService } from '$lib/api/services/PostsService';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import { StorageService } from '$lib/api/services';

export function createPostsState(getCommunityId: () => string | null = () => null) {
	let posts = $state<Post[]>([]);
	let sort = $state<SortOption>('new');
	let feedType = $state<FeedType>('global');
	let page = $state(1);
	let hasMore = $state(true);
	let loading = $state(false);
	const pageSize = 10;

	// Cache of user's community IDs for personalized feed filtering
	let myCommunityIds = $state<Set<string>>(new Set());
	let communitiesFetched = $state(false);

	async function ensureMyCommunities() {
		if (communitiesFetched) return;
		try {
			const res = await CommunitiesService.list(1, 100);
			const ids = res.items
				.filter((c: any) => c.user_membership_status === 'approved')
				.map((c: any) => c.id);
			myCommunityIds = new Set(ids);
			communitiesFetched = true;
		} catch (e) {
			console.error('Failed to fetch my communities for feed filter:', e);
		}
	}

	function mapPost(p: any): Post {
		return {
			id: p.id,
			title: p.title,
			authorId: p.author?.id || 'anonymous',
			authorName: p.author?.username || 'Anonymous',
			authorSurname: '',
			authorUsername: p.author?.username || 'anonymous',
			authorAvatar:
				StorageService.getPublicUrl('user-assets', p.author?.avatar_key ?? null) || undefined,
			content: p.body || p.title,
			createdAt: p.created_at,
			likes: p.score,
			comments: p.comment_count,
			liked: p.user_vote === 1,
			university: p.community?.name || 'Global',
			communityId: p.community?.id,
			communityName: p.community?.name
		};
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;

		try {
			let response;
			const communityId = getCommunityId();
			if (communityId) {
				response = await CommunitiesService.getPosts(communityId, page, pageSize, sort);
			} else {
				response = await PostsService.getGlobalFeed(page, pageSize, sort);
			}

			let mappedPosts: Post[] = response.items.map(mapPost);

			// For personalized feed (home only), filter to user's communities
			if (!communityId && feedType === 'personalized') {
				await ensureMyCommunities();
				mappedPosts = mappedPosts.filter(
					(p) => p.communityId && myCommunityIds.has(p.communityId)
				);
			}

			posts = [...posts, ...mappedPosts];
			hasMore = page < response.pages;
			if (hasMore) page++;
		} catch (e) {
			console.error('Failed to load posts:', e);
			hasMore = false;
		} finally {
			loading = false;
		}
	}

	function setSort(sortOption: SortOption) {
		if (sort === sortOption) return;

		sort = sortOption;
		posts = [];
		page = 1;
		hasMore = true;
		loadMore();
	}

	function setFeedType(type: FeedType) {
		if (feedType === type) return;
		feedType = type;
		posts = [];
		page = 1;
		hasMore = true;
		loadMore();
	}

	async function toggleLike(postId: string | number) {
		const postIndex = posts.findIndex((p) => p.id === postId);
		if (postIndex === -1) return;

		const post = posts[postIndex];
		const newValue = post.liked ? 0 : 1;

		posts = posts.map((p) => {
			if (p.id === postId) {
				return {
					...p,
					liked: !p.liked,
					likes: p.liked ? p.likes - 1 : p.likes + 1
				};
			}
			return p;
		});

		try {
			await PostsService.votePost(postId.toString(), newValue);
		} catch (e) {
			console.error('Failed to vote:', e);
			// Revert optimistic update
			posts = posts.map((p) => {
				if (p.id === postId) {
					return {
						...p,
						liked: !p.liked,
						likes: p.liked ? p.likes - 1 : p.likes + 1
					};
				}
				return p;
			});
		}
	}

	function reset() {
		posts = [];
		page = 1;
		hasMore = true;
		sort = 'new';
		feedType = 'global';
	}

	return {
		get posts() {
			return posts;
		},
		get sort() {
			return sort;
		},
		get feedType() {
			return feedType;
		},
		get page() {
			return page;
		},
		get hasMore() {
			return hasMore;
		},
		get loading() {
			return loading;
		},
		loadMore,
		setSort,
		setFeedType,
		toggleLike,
		reset
	};
}
