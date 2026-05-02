<script lang="ts">
	import { searchState } from '$lib/stores/search.svelte';
	import { goto } from '$app/navigation';

	let searchInput = $state('');

	function handleSearch() {
		searchState.search(searchInput, searchState.filter);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
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

	// Check if results are empty after search
	function hasNoResults(): boolean {
		if (!searchState.hasSearched) return false;
		if (searchState.loading) return false;

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
	{:else if !searchState.hasSearched && (searchState.filter === 'users' || searchState.filter === 'posts')}
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
					><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg
				>
			</div>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Start searching</h3>
			<p class="max-w-sm text-muted-foreground">
				Enter a search term to find {searchState.filter === 'users' ? 'users' : 'posts'}
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
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Users</h2>
					<div class="space-y-3">
						{#each searchState.users as user (user.id)}
							<button
								class="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-md"
								onclick={() => goto('/profile')}
							>
								<div
									class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary transition-all duration-300 group-hover:bg-primary/20"
								>
									{user.avatarInitials}
								</div>
								<div class="flex-1">
									<div class="font-semibold text-card-foreground">{user.name}</div>
									<div class="text-sm text-muted-foreground">@{user.username}</div>
								</div>
								<div class="text-right">
									<div class="text-sm font-medium text-card-foreground">{user.followers}</div>
									<div class="text-xs text-muted-foreground">followers</div>
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
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
						Communities
					</h2>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each searchState.communities as community (community.id)}
							<div class="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30">
								<div class="mb-2 flex items-start justify-between">
									<div>
										<h3 class="font-semibold text-card-foreground">{community.name}</h3>
										<p class="text-sm text-muted-foreground">{community.description}</p>
									</div>
								</div>
								<div class="mt-auto flex items-center justify-between">
									<div class="flex gap-4 text-sm text-muted-foreground">
										<span>{community.members} members</span>
										<span>{community.posts} posts</span>
									</div>
									<button
										class="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300
										{community.isJoined
											? 'border border-border bg-card text-foreground hover:bg-secondary'
											: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40'}"
										onclick={() => searchState.toggleJoinCommunity(community.id)}
									>
										{community.isJoined ? 'Joined' : 'Join'}
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
					<h2 class="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Posts</h2>
					<div class="space-y-3">
						{#each searchState.posts as post (post.id)}
							<article class="group rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30">
								<div class="mb-2 flex items-center gap-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary transition-all duration-300 group-hover:bg-primary/20"
									>
										{post.authorName.charAt(0)}
									</div>
									<div>
										<span class="font-medium text-card-foreground">{post.authorName}</span>
										<span class="text-sm text-muted-foreground"> @{post.authorUsername}</span>
									</div>
									<span class="text-xs text-muted-foreground/60">· {formatTimeAgo(post.createdAt)}</span>
								</div>
								<p class="text-card-foreground/90 leading-relaxed">{post.content}</p>
								<div class="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
									<span>{post.likes} likes</span>
									<span>{post.comments} comments</span>
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
