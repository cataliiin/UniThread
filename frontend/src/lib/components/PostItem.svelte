<script lang="ts">
	import type { Post } from '$lib/types/post';
	import { user } from '$lib/stores/user.svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';
	let {
		post,
		isFullView = false,
		showCommunity = false,
		onToggleLike
	}: {
		post: Post;
		isFullView?: boolean;
		showCommunity?: boolean;
		onToggleLike?: (id: string | number) => void;
	} = $props();

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

	function handleLikeClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (onToggleLike) {
			onToggleLike(post.id);
		}
	}

	function handleEditClick(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (user.id !== post.authorId) {
			toast.error('You are not authorized to edit this post.');
			return;
		}
		goto(`/posts/${post.id}/edit`);
	}
</script>

<article
	class="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 {isFullView
		? ''
		: 'hover:border-primary/30 hover:shadow-[0_0_20px_rgba(50,65,95,0.1)]'}"
>
	{#if isFullView}
		<div class="block">
			{@render PostContent({ post, formatTimeAgo, handleLikeClick })}
		</div>
	{:else}
		<a href={`/posts/${post.id}`} class="block outline-none">
			{@render PostContent({ post, formatTimeAgo, handleLikeClick })}
		</a>
	{/if}
</article>

{#snippet PostContent({
	post,
	formatTimeAgo,
	handleLikeClick
}: {
	post: Post;
	formatTimeAgo: (d: string) => string;
	handleLikeClick: (e: Event) => void;
})}
	<!-- Author Header -->
	<div class="mb-3 flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary transition-all duration-300 group-hover:bg-primary/20"
		>
			{post.authorName.charAt(0)}
		</div>
		<div class="flex-1">
			<div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
				<span class="font-semibold text-card-foreground">{post.authorName}</span>
				<span class="text-sm text-muted-foreground">@{post.authorUsername}</span>
				{#if showCommunity && post.communityName}
					<span class="text-sm text-muted-foreground/50">·</span>
					<span class="text-sm text-muted-foreground">in</span>
					<a
						href={`/communities/${post.communityId}`}
						onclick={(e) => e.stopPropagation()}
						class="text-sm font-medium text-primary transition-colors hover:text-primary/70 hover:underline"
					>{post.communityName}</a>
				{/if}
			</div>
			<span class="text-xs text-muted-foreground/60">{formatTimeAgo(post.createdAt)}</span>
		</div>
	</div>



	<h1 class="mb-2 font-semibold text-foreground">{post.title}</h1>

	<!-- Content -->
	<p
		class="mb-4 leading-relaxed text-card-foreground/90 {isFullView
			? 'text-lg whitespace-pre-wrap'
			: 'line-clamp-3'}"
	>
		{post.content}
	</p>

	<!-- Actions -->
	<div class="flex items-center gap-4 border-t border-border/50 pt-3">
		<button
			class="flex items-center gap-1.5 text-sm transition-all duration-300
			{post.liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}"
			onclick={handleLikeClick}
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

		<div
			class="flex items-center gap-1.5 text-sm text-muted-foreground transition-all duration-300 hover:text-foreground"
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
				><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg
			>
			<span>{post.comments}</span>
		</div>
		{#if user.isAuthenticated && user.id === post.authorId}
			<button
				class="flex items-center gap-1.5 text-sm text-muted-foreground transition-all duration-300 hover:text-primary"
				onclick={handleEditClick}
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
				>
					<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
				</svg>
				<span>Edit</span>
			</button>
		{/if}
	</div>
{/snippet}
