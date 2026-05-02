<script lang="ts">
	import { posts } from '$lib/stores/posts.svelte';
	import { onMount } from 'svelte';

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

	function formatTimeAgo(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${diffDays}d ago`;
	}
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
			<article class="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(50,65,95,0.1)]">
				<!-- Author Header -->
				<div class="mb-3 flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary transition-all duration-300 group-hover:bg-primary/20"
					>
						{post.authorName.charAt(0)}
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<span class="font-semibold text-card-foreground">{post.authorName}</span>
							<span class="text-sm text-muted-foreground">@{post.authorUsername}</span>
						</div>
						<span class="text-xs text-muted-foreground/60">{formatTimeAgo(post.createdAt)}</span>
					</div>
				</div>

				<!-- Content -->
				<p class="mb-4 text-card-foreground/90 leading-relaxed">{post.content}</p>

				<!-- Actions -->
				<div class="flex items-center gap-4 border-t border-border/50 pt-3">
					<button
						class="flex items-center gap-1.5 text-sm transition-all duration-300
						{post.liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}"
						onclick={() => posts.toggleLike(post.id)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill={post.liked ? 'currentColor' : 'none'}
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class={post.liked ? '' : 'fill-none'}
							><path
								d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
							/></svg
						>
						<span>{post.likes}</span>
					</button>

					<button class="flex items-center gap-1.5 text-sm text-muted-foreground transition-all duration-300 hover:text-foreground">
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
							><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg
						>
						<span>{post.comments}</span>
					</button>
				</div>
			</article>
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
