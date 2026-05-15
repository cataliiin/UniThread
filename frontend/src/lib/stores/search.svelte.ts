import { getAuthorDisplayName } from '$lib/utils/user';
import {

	type SearchFilter,
	type UserResult,
	type CommunityResult,
	type PostResult,
} from '$lib/types/search';
import { SearchService } from '$lib/api/services/SearchService';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import { PostsService } from '$lib/api/services/PostsService';
import { user } from './user.svelte';
import { toasts } from './toast.svelte';
import type { components } from '$lib/api/openapi-generated-schema';

type PostFeedResponse = components['schemas']['PostFeedResponse'];

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
		
		if (!searchQuery.trim()) {
			hasSearched = false;
			await loadDiscovery();
			return;
		}

		hasSearched = true;
		loading = true;

		try {
			const typeParam = searchFilter === 'all' ? undefined : searchFilter;
			
			// If user searches for "@username", strip the "@" so the backend matches the raw username
			const apiQuery = searchQuery.startsWith('@') ? searchQuery.substring(1) : searchQuery;
			
			const results = await SearchService.globalSearch(apiQuery, typeParam, 10);

			if (searchFilter === 'all' || searchFilter === 'users') {
				users = results.users.map(u => ({
					...u
				}));
			} else {
				users = [];
			}

			if (searchFilter === 'all' || searchFilter === 'communities') {
				communities = results.communities.map(c => ({
					...c,
					is_joined: c.user_membership_status === 'approved'
				}));
			} else {
				communities = [];
			}

			if (searchFilter === 'all' || searchFilter === 'posts') {
				posts = results.posts.map((p: PostFeedResponse) => ({
					...p,
					liked: p.user_vote === 1,
					university: p.community?.name || 'Global'
				}));
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

	async function loadDiscovery() {
		if (query.trim()) return;
		loading = true;
		
		try {
			if (filter === 'all' || filter === 'communities') {
				const commRes = await CommunitiesService.list(1, filter === 'all' ? 3 : 6);
				communities = commRes.items.map(c => ({
					...c,
					is_joined: c.user_membership_status === 'approved'
				}));
			} else {
				communities = [];
			}

			if (filter === 'all' || filter === 'posts') {
				const postRes = await PostsService.getGlobalFeed(1, 5, 'top');
				posts = postRes.items.map((p: PostFeedResponse) => ({
					...p,
					liked: p.user_vote === 1,
					university: p.community?.name || 'Global'
				}));
			} else {
				posts = [];
			}

			// Users always empty on discovery as requested
			users = [];
		} catch (e) {
			console.error("Discovery load failed:", e);
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
		hasSearched = false;
		loadDiscovery();
	}

	async function toggleJoinCommunity(communityId: string | number) {
		const idStr = communityId.toString();
		const community = communities.find(c => c.id === communityId);
		if (!community) return;

		try {
			if (community.is_joined) {
				await CommunitiesService.leave(idStr);
				community.is_joined = false;
				community.member_count--;
				toasts.show('Left community', 'success');
			} else {
				const res = await CommunitiesService.join(idStr);
				community.is_joined = res.status === 'approved';
				if (res.status === 'approved') {
					community.member_count++;
					toasts.show('Joined community', 'success');
				} else {
					toasts.show('Join request sent', 'success');
				}
			}
		} catch (error) {
			toasts.show((error as Error).message || 'Action failed', 'error');
		}
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
		loadDiscovery,
		toggleJoinCommunity
	};
}

export const searchState = createSearchState();
