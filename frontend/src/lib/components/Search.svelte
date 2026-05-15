<script lang="ts">
	import { searchState } from '$lib/stores/search.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getAuthorDisplayName } from '$lib/utils/user';
	import { StorageService } from '$lib/api/services';

	onMount(() => {
		if (!searchState.hasSearched && !searchInput) {
			searchState.loadDiscovery();
		}
	});

	let searchInput = $state('');
	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleSearch() {
		if (searchInput.trim().length >= 2 || searchInput.trim().length === 0) {
			searchState.search(searchInput, searchState.filter);
		}
	}

	// Debounce search effect
	$effect(() => {
		const query = searchInput.trim();
		clearTimeout(debounceTimer);
		
		// Don't search for < 2 characters
		if (query.length >= 2) {
			debounceTimer = setTimeout(() => {
				searchState.search(query, searchState.filter);
			}, 400);
		} else if (query.length === 0 && searchState.hasSearched) {
			searchState.clearSearch();
		}

		return () => clearTimeout(debounceTimer);
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			clearTimeout(debounceTimer); // Cancel pending debounce
			handleSearch();
		}
	}

	function formatTimeAgo(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffHours < 1) return 'just now';
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${diffDays}d ago`;
	}

	const filters: Array<{ value: 'all' | 'users' | 'communities' | 'posts'; label: string }> = [
		{ value: 'all', label: 'All' },
		{ value: 'users', label: 'Users' },
		{ value: 'communities', label: 'Communities' },
		{ value: 'posts', label: 'Posts' }
	];

	// Check if users section should show placeholder on "all" without query
	function shouldShowUsersPlaceholder(): boolean {
		const hasQuery = searchInput.trim() !== '';
		const filter = searchState.filter;
		return (
			!hasQuery && searchState.hasSearched && filter === 'all' && searchState.users.length === 0
		);
	}

	// Check if posts section should show placeholder on "all" without query
	function shouldShowPostsPlaceholder(): boolean {
		const hasQuery = searchInput.trim() !== '';
		const filter = searchState.filter;
		return (
			!hasQuery && searchState.hasSearched && filter === 'all' && searchState.posts.length === 0
		);
	}

	function getImageUrl(key: string | null | undefined, bucket: 'user-assets' | 'community-assets'): string | null {
		return StorageService.getPublicUrl(bucket, key ?? null);
	}

	// Check if results are empty after search
	function hasNoResults(): boolean {
		if (searchState.loading) return false;
		if (!searchState.hasSearched && searchState.filter === 'users') return false; // Show placeholder instead

		const { users, communities, posts } = searchState;
		return users.length === 0 && communities.length === 0 && posts.length === 0;
	}
</script>

<div class="space-y-6">
	<!-- Search Input -->
	<div class="relative">
		<svg
			class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			bind:value={searchInput}
			onkeydown={handleKeydown}
			placeholder="Search users, communities, posts..."
			class="w-full rounded-xl border border-input bg-background py-3 pr-4 pl-12 text-foreground placeholder-muted-foreground shadow-sm transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
		/>
		{#if searchInput}
			<button
				onclick={() => {
					searchInput = '';
					searchState.clearSearch();
				}}
				class="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 hover:text-foreground"
				aria-label="Clear search"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg
				>
			</button>
		{/if}
	</div>

	<!-- Filter Tabs -->
	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each filters as f}
			<button
				class="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300
				{searchState.filter === f.value
					? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
					: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
				onclick={() => searchState.setFilter(f.value)}
			>
				{f.label}
			</button>
		{/each}
	</div>

	<!-- Loading State -->
	{#if searchState.loading}
		<div class="flex justify-center py-12">
			<svg
				class="h-8 w-8 animate-spin text-primary"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
		<!-- Empty State - No query for users/posts -->
	{:else if !searchState.hasSearched && searchState.filter === 'users'}
		<div class="flex flex-col items-center justify-center py-20 text-center">
			<div class="mb-6 rounded-full bg-primary/10 p-8 shadow-inner">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-primary"
				>
					<circle cx="10" cy="7" r="4" />
					<path d="M10.3 15H7a4 4 0 0 0-4 4v2" />
					<circle cx="17" cy="17" r="3" />
					<path d="m21 21-1.9-1.9" />
				</svg>
			</div>
			<h3 class="mb-2 text-xl font-bold text-foreground">Find People</h3>
			<p class="max-w-xs text-muted-foreground">
				Search for your friends, classmates or researchers by their name or username.
			</p>
		</div>
		<!-- No Results -->
	{:else if hasNoResults()}
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div class="mb-4 rounded-full bg-secondary p-4 transition-all duration-300 hover:bg-secondary/80">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-muted-foreground"
					><circle cx="12" cy="12" r="10" /><line x1="8" x2="16" y1="12" y2="12" /></svg
				>
			</div>
			<h3 class="mb-2 text-lg font-semibold text-foreground">No results found</h3>
			<p class="max-w-sm text-muted-foreground">Try adjusting your search or filters</p>
		</div>
		<!-- Results -->
	{:else}
		<div class="space-y-6">
			<!-- Users Section -->
			{#if searchState.users.length > 0}
				<section>
					<h2 class="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
						Users
					</h2>
					<div class="space-y-3">
						{#each searchState.users as user (user.id)}
							<button
								class="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-md"
								onclick={() => goto(`/profile/${user.id}`)}
							>
								<div
									class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary transition-all duration-300 group-hover:bg-primary/20"
								>
									{#if user.avatar_key}
										<img src={getImageUrl(user.avatar_key, 'user-assets')} alt={getAuthorDisplayName(user)} class="h-full w-full object-cover" />
									{:else}
										{getAuthorDisplayName(user).substring(0, 2).toUpperCase()}
									{/if}
								</div>
								<div class="flex-1">
									<div class="font-semibold text-card-foreground">{getAuthorDisplayName(user)}</div>
									<div class="text-sm text-muted-foreground">@{user.username}</div>
								</div>

							</button>
						{/each}
					</div>
				</section>
			{:else if shouldShowUsersPlaceholder()}
				<section>
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Users</h2>
					<div class="rounded-xl border border-border bg-card p-8 text-center">
						<p class="text-sm text-muted-foreground">Enter a search term to find users</p>
					</div>
				</section>
			{/if}

			<!-- Communities Section -->
			{#if searchState.communities.length > 0}
				<section>
					<h2 class="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18.1H3"/></svg>
						{searchState.hasSearched ? 'Communities' : 'Suggested Communities'}
					</h2>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each searchState.communities as community (community.id)}
							<div 
								role="button"
								tabindex="0"
								class="group flex flex-col text-left rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 cursor-pointer"
								onclick={() => goto(`/communities/${community.id}`)}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') goto(`/communities/${community.id}`); }}
							>
								<div class="mb-4 flex items-center gap-4">
									<div class="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-sidebar/50">
										{#if community.icon_key}
											<img src={getImageUrl(community.icon_key, 'community-assets')} alt={community.name} class="h-full w-full object-cover" />
										{:else}
											<div class="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
												{community.name.charAt(0).toUpperCase()}
											</div>
										{/if}
									</div>
									<div class="min-w-0">
										<h3 class="truncate font-semibold text-card-foreground group-hover:text-primary transition-colors">{community.name}</h3>
										<p class="truncate text-sm text-muted-foreground">{community.description}</p>
									</div>
								</div>
								<div class="mt-auto flex w-full items-center justify-between">
									<div class="flex gap-4 text-sm text-muted-foreground">
										<span>{community.member_count} members</span>
									</div>
									<button
										class="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300
										{community.is_joined
											? 'border border-border bg-card text-foreground hover:bg-secondary'
											: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40'}"
										onclick={(e) => {
											e.stopPropagation();
											searchState.toggleJoinCommunity(community.id);
										}}
									>
										{community.is_joined ? 'Joined' : (community.type === 'request' ? 'Request' : 'Join')}
									</button>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Posts Section -->
			{#if searchState.posts.length > 0}
				<section>
					<h2 class="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-muted-foreground uppercase">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
						{searchState.hasSearched ? 'Posts' : 'Top Discussions'}
					</h2>
					<div class="space-y-3">
						{#each searchState.posts as post (post.id)}
							<article class="group rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30">
								{#if !post.author}
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary transition-all duration-300"
										>
											A
										</div>
										<div>
											<span class="font-medium text-card-foreground">Anonymous</span>
										</div>
									</div>
								{:else}
									<button 
										class="flex items-center gap-3 hover:opacity-80 transition-opacity"
										onclick={(e) => { e.stopPropagation(); goto(`/profile/${post.author?.id}`); }}
									>
										<div
											class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary transition-all duration-300 group-hover:bg-primary/20"
										>
											{#if post.author.avatar_key}
												<img src={getImageUrl(post.author.avatar_key, 'user-assets')} alt={getAuthorDisplayName(post.author)} class="h-full w-full object-cover" />
											{:else}
												{getAuthorDisplayName(post.author).charAt(0)}
											{/if}
										</div>
										<div>
											<span class="font-medium text-card-foreground">{getAuthorDisplayName(post.author)}</span>
											<span class="text-sm text-muted-foreground"> @{post.author.username}</span>
										</div>
									</button>
								{/if}
								<p class="text-card-foreground/90 leading-relaxed">{post.body}</p>
								<div class="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
									<span>{post.score} likes</span>
									<span>{post.comment_count} comments</span>
								</div>
							</article>
						{/each}
					</div>
				</section>
			{:else if shouldShowPostsPlaceholder()}
				<section>
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Posts</h2>
					<div class="rounded-xl border border-border bg-card p-8 text-center">
						<p class="text-sm text-muted-foreground">Enter a search term to find posts</p>
					</div>
				</section>
			{/if}
		</div>
	{/if}
</div>
