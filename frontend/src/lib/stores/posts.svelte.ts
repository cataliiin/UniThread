import { type Post, type SortOption } from '$lib/types/post';
import { PostsService } from '$lib/api/services/PostsService';

function createPostsState() {
	let posts = $state<Post[]>([]);
	let sort = $state<SortOption>('new');
	let page = $state(1);
	let hasMore = $state(true);
	let loading = $state(false);
	const pageSize = 10;

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;

		try {
			const response = await PostsService.getGlobalFeed(page, pageSize, sort);
			
			const mappedPosts: Post[] = response.items.map(p => ({
				id: p.id,
				authorId: p.author?.id || 'anonymous',
				authorName: p.author?.username || 'Anonymous', 
				authorUsername: p.author?.username || 'anonymous',
				authorAvatar: p.author?.avatar_key || undefined,
				content: p.body || p.title,
				createdAt: p.created_at,
				likes: p.score,
				comments: p.comment_count,
				liked: p.user_vote === 1,
				university: p.community?.name || 'Global'
			}));

			posts = [...posts, ...mappedPosts];
			hasMore = page < response.pages;
			if (hasMore) page++;
		} catch (e) {
			console.error("Failed to load posts:", e);
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

	async function toggleLike(postId: string | number) {
		const postIndex = posts.findIndex(p => p.id === postId);
		if (postIndex === -1) return;
		
		const post = posts[postIndex];
		const newValue = post.liked ? 0 : 1;
		
		posts = posts.map(p => {
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
			console.error("Failed to vote:", e);
			posts = posts.map(p => {
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
		page = 0;
		hasMore = true;
		sort = 'new';
	}

	return {
		get posts() {
			return posts;
		},
		get sort() {
			return sort;
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
		toggleLike,
		reset
	};
}

export const posts = createPostsState();
