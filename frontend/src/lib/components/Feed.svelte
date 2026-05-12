<script lang="ts">
	import { createPostsState } from '$lib/stores/posts.svelte';
	import PostItem from './PostItem.svelte';
	import { onMount } from 'svelte';
	import { user } from '$lib/stores/user.svelte';

	let { communityId = null }: { communityId?: string | null } = $props();

	// Instantiate the store explicitly for this feed
	const posts = createPostsState(() => communityId);

	let containerRef: HTMLDivElement;

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

	<!-- Posts Feed -->
	<div class="space-y-4">
		{#each posts.posts as post (post.id)}
			<PostItem {post} showCommunity={!communityId} onToggleLike={posts.toggleLike} />
		{/each}

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
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span class="text-sm">Loading more posts...</span>
				</div>
			{:else if !posts.hasMore}
				<p class="text-sm text-muted-foreground/60">You've reached the end!</p>
			{/if}
		</div>
	</div>
</div>
