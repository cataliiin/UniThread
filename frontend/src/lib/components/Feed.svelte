<script lang="ts">
	import { createPostsState } from '$lib/stores/posts.svelte';
	import PostItem from './PostItem.svelte';
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user.svelte';

	let { communityId = null, refresh = $bindable() }: { communityId?: string | null; refresh?: () => void } = $props();

	// Instantiate the store explicitly for this feed
	const posts = createPostsState(() => communityId);

	refresh = () => {
		posts.refresh();
	};

	let containerRef: HTMLDivElement;

	// Whether we're on the home feed (show toggle) or a community feed (no toggle)
	let isHomeFeed = $derived(!communityId);

	onMount(() => {
		// Initial load
		posts.loadMore();

		// Intersection Observer for infinite scroll
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !posts.loading && posts.hasMore) {
					posts.loadMore();
				}
			},
			{ threshold: 0.1 }
		);

		if (containerRef) {
			observer.observe(containerRef);
		}

		return () => observer.disconnect();
	});
</script>

<div class="space-y-4">
	<!-- Feed Toggle + Sort Controls -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<!-- Feed Type Toggle (only on home) -->
		{#if isHomeFeed}
			<div class="flex items-center gap-2">
				<button
					class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300
					{posts.feedType === 'global'
						? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
						: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					onclick={() => posts.setFeedType('global')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path
							d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
						/></svg
					>
					Global
				</button>
				<button
					class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300
					{posts.feedType === 'personalized'
						? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
						: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
					onclick={() => posts.setFeedType('personalized')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
							cx="9"
							cy="7"
							r="4"
						/><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path
							d="M16 3.13a4 4 0 0 1 0 7.75"
						/></svg
					>
					My Communities
				</button>
			</div>
		{/if}

		<!-- Sort Controls -->
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Sort by:</span>
			<button
				class="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300
				{posts.sort === 'new'
					? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
					: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
				onclick={() => posts.setSort('new')}
			>
				New
			</button>
			<button
				class="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300
				{posts.sort === 'top'
					? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
					: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
				onclick={() => posts.setSort('top')}
			>
				Top
			</button>
		</div>
	</div>

	<!-- Posts Feed -->
	<div class="space-y-4">
		{#each posts.posts as post (post.id)}
			<PostItem {post} showCommunity={!communityId} onToggleLike={posts.toggleLike} />
		{/each}

		<!-- Empty state for personalized feed -->
		{#if !posts.loading && posts.posts.length === 0 && posts.feedType === 'personalized'}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<div
					class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl"
				>
					👥
				</div>
				<h3 class="mb-2 text-lg font-semibold text-foreground">No posts from your communities</h3>
				<p class="max-w-md text-sm text-muted-foreground">
					Join more communities to see their posts here, or switch to the Global feed.
				</p>
			</div>
		{/if}

		<!-- Loading / Infinite Scroll Trigger -->
		<div bind:this={containerRef} class="py-4 text-center">
			{#if posts.loading}
				<div class="flex items-center justify-center gap-2 text-muted-foreground">
					<svg
						class="h-5 w-5 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span class="text-sm">Loading more posts...</span>
				</div>
			{:else if !posts.hasMore && posts.posts.length > 0}
				<p class="text-sm text-muted-foreground/60">You've reached the end!</p>
			{/if}
		</div>
	</div>
</div>
