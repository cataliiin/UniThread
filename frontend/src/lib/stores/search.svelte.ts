import {
	type SearchFilter,
	type UserResult,
	type CommunityResult,
	type PostResult,
} from '$lib/types/search';
import { SearchService } from '$lib/api/services/SearchService';
import { user } from './user.svelte';

function createSearchState() {
	let query = $state('');
	let filter = $state<SearchFilter>('all');
	let users = $state<UserResult[]>([]);
	let communities = $state<CommunityResult[]>([]);
	let posts = $state<PostResult[]>([]);
	let loading = $state(false);
	let hasSearched = $state(false);

	async function search(searchQuery: string, searchFilter: SearchFilter) {
		query = searchQuery;
		filter = searchFilter;
		hasSearched = true;
		
		if (!searchQuery.trim()) {
			users = [];
			communities = [];
			posts = [];
			loading = false;
			return;
		}

		loading = true;

		try {
			const typeParam = searchFilter === 'all' ? undefined : searchFilter;
			const results = await SearchService.globalSearch(searchQuery, typeParam, 10);

			if (searchFilter === 'all' || searchFilter === 'users') {
				users = results.users.map(u => ({
					id: u.id,
					name: u.username,
					username: u.username,
					avatar: u.avatar_key || undefined,
					avatarInitials: u.username.substring(0, 2).toUpperCase(),
					memberSince: new Date(u.created_at).getFullYear().toString(),
					followers: 0,
					university: 'University' // Or derive from university_id
				}));
			} else {
				users = [];
			}

			if (searchFilter === 'all' || searchFilter === 'communities') {
				communities = results.communities.map(c => ({
					id: c.id,
					name: c.name,
					description: c.description || '',
					members: c.member_count,
					isJoined: c.user_membership_status === 'approved',
					icon: c.icon_key || undefined,
					posts: 0,
					university: 'University'
				}));
			} else {
				communities = [];
			}

			if (searchFilter === 'all' || searchFilter === 'posts') {
				posts = results.posts.map(p => ({
					id: p.id,
					title: p.title,
					content: p.body || p.title,
					authorId: p.author?.id || 'anonymous',
					authorName: p.author?.username || 'Anonymous',
					authorUsername: p.author?.username || 'anonymous',
					createdAt: p.created_at,
					likes: p.score,
					comments: p.comment_count,
					communityName: p.community?.name || 'Global',
					university: 'University'
				}));
			} else {
				posts = [];
			}
		} catch (e) {
			console.error("Search failed:", e);
			users = [];
			communities = [];
			posts = [];
		} finally {
			loading = false;
		}
	}

	function setFilter(newFilter: SearchFilter) {
		filter = newFilter;
		// Re-search with current query and new filter
		search(query, newFilter);
	}

	function clearSearch() {
		query = '';
		users = [];
		communities = [];
		posts = [];
		hasSearched = false;
		loading = false;
	}

	function toggleJoinCommunity(communityId: string | number) {
		communities = communities.map((c) => {
			if (c.id === communityId) {
				return {
					...c,
					isJoined: !c.isJoined,
					members: c.isJoined ? c.members - 1 : c.members + 1
				};
			}
			return c;
		});
	}

	return {
		get query() {
			return query;
		},
		get filter() {
			return filter;
		},
		get users() {
			return users;
		},
		get communities() {
			return communities;
		},
		get posts() {
			return posts;
		},
		get loading() {
			return loading;
		},
		get hasSearched() {
			return hasSearched;
		},
		search,
		setFilter,
		clearSearch,
		toggleJoinCommunity
	};
}

export const searchState = createSearchState();
