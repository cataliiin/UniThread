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
		<span class="text-sm font-medium text-slate-600">Sort by:</span>
		<button
			class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors
			{posts.sort === 'new' 
				? 'bg-slate-900 text-white' 
				: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
			onclick={() => posts.setSort('new')}
		>
			New
		</button>
		<button
			class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors
			{posts.sort === 'top' 
				? 'bg-slate-900 text-white' 
				: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
			onclick={() => posts.setSort('top')}
		>
			Top
		</button>
	</div>

	<!-- Posts Feed -->
	<div class="space-y-4">
		{#each posts.posts as post (post.id)}
			<article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<!-- Author Header -->
				<div class="mb-3 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
						{post.authorName.charAt(0)}
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<span class="font-semibold text-slate-900">{post.authorName}</span>
							<span class="text-sm text-slate-500">@{post.authorUsername}</span>
						</div>
						<span class="text-xs text-slate-400">{formatTimeAgo(post.createdAt)}</span>
					</div>
				</div>

				<!-- Content -->
				<p class="mb-4 text-slate-700">{post.content}</p>

				<!-- Actions -->
				<div class="flex items-center gap-4 border-t border-slate-100 pt-3">
					<button
						class="flex items-center gap-1.5 text-sm transition-colors
						{post.liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}"
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
						><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg
						>
						<span>{post.likes}</span>
					</button>

					<button class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
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
				<div class="flex items-center justify-center gap-2 text-slate-500">
					<svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span class="text-sm">Loading more posts...</span>
				</div>
			{:else if !posts.hasMore}
				<p class="text-sm text-slate-400">You've reached the end!</p>
			{/if}
		</div>
	</div>
</div>