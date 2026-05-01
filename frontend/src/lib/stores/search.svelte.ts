import {
	type SearchFilter,
	type UserResult,
	type CommunityResult,
	type PostResult,
	mockSearch
} from '$lib/types/search';
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
		loading = true;

		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 500));

		const university = user.university || 'Default University';

		if (searchFilter === 'all' || searchFilter === 'users') {
			// Only show users when there's a query
			users =
				searchQuery.trim() !== '' ? mockSearch.generateUsers(searchQuery, university, 10) : [];
		} else {
			users = [];
		}

		if (searchFilter === 'all' || searchFilter === 'communities') {
			// Communities show popular when no query, filtered when query exists
			communities = mockSearch.generateCommunities(searchQuery, university, 10);
		} else {
			communities = [];
		}

		if (searchFilter === 'all' || searchFilter === 'posts') {
			// Only show posts when there's a query
			posts =
				searchQuery.trim() !== '' ? mockSearch.generatePosts(searchQuery, university, 10) : [];
		} else {
			posts = [];
		}

		loading = false;
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

	function toggleJoinCommunity(communityId: number) {
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
