import { type Post, type SortOption, mockPosts } from '$lib/types/post';
import { user } from './user.svelte';

function createPostsState() {
	let posts = $state<Post[]>([]);
	let sort = $state<SortOption>('new');
	let page = $state(0);
	let hasMore = $state(true);
	let loading = $state(false);
	const pageSize = 10;

	async function loadMore() {
		if (loading || !hasMore) return;

		loading = true;

		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 800));

		const university = user.university || 'Default University';
		const newPosts = mockPosts.generate(university, pageSize, posts.length);

		// Sort based on current sort option
		if (sort === 'top') {
			newPosts.sort((a, b) => b.likes - a.likes);
		}

		posts = [...posts, ...newPosts];
		page++;
		
		// Limit to 50 posts for demo
		hasMore = posts.length < 50;
		loading = false;
	}

	function setSort(sortOption: SortOption) {
		if (sort === sortOption) return;
		
		sort = sortOption;
		posts = [];
		page = 0;
		hasMore = true;
		loadMore();
	}

	function toggleLike(postId: number) {
		posts = posts.map(post => {
			if (post.id === postId) {
				return {
					...post,
					liked: !post.liked,
					likes: post.liked ? post.likes - 1 : post.likes + 1
				};
			}
			return post;
		});
	}

	function reset() {
		posts = [];
		page = 0;
		hasMore = true;
		sort = 'new';
	}

	return {
		get posts() { return posts; },
		get sort() { return sort; },
		get page() { return page; },
		get hasMore() { return hasMore; },
		get loading() { return loading; },
		loadMore,
		setSort,
		toggleLike,
		reset
	};
}

export const posts = createPostsState();