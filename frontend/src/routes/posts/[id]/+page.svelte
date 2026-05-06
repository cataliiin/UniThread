<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { PostsService } from '$lib/api/services/PostsService';
	import type { Post } from '$lib/types/post';
	import PostItem from '$lib/components/PostItem.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let postId = $derived($page.params.id || '');
	let post = $state<Post | null>(null);
	let loading = $state(true);

	onMount(async () => {
		if (!postId) return;
		try {
			const p = await PostsService.getPost(postId);
			post = {
				id: p.id,
				title: p.title,
				authorId: p.author?.id || 'anonymous',
				authorName: p.author?.username || 'Anonymous', 
				authorSurname: '',
				authorUsername: p.author?.username || 'anonymous',
				authorAvatar: p.author?.avatar_key || undefined,
				content: p.body || p.title,
				createdAt: p.created_at,
				likes: p.score,
				comments: p.comment_count,
				liked: p.user_vote === 1,
				university: p.community?.name || 'Global'
			};
		} catch (e: any) {
			toast.error('Failed to load post.');
		} finally {
			loading = false;
		}
	});

	async function handleToggleLike(id: string | number) {
		if (!post) return;
		
		const newValue = post.liked ? 0 : 1;
		
		// Optimistic update
		post.liked = !post.liked;
		post.likes = post.liked ? post.likes + 1 : post.likes - 1;

		try {
			await PostsService.votePost(id.toString(), newValue);
		} catch (e) {
			console.error("Failed to vote:", e);
			// Revert on failure
			post.liked = !post.liked;
			post.likes = post.liked ? post.likes + 1 : post.likes - 1;
		}
	}
</script>

<svelte:head>
	<title>{post ? `Post by ${post.authorName}` : 'Post'} | UniThread</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<button
		class="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
		onclick={() => history.back()}
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="m15 18-6-6 6-6"/>
		</svg>
		Back
	</button>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-3 text-muted-foreground">
				<svg class="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<span>Loading post...</span>
			</div>
		</div>
	{:else if post}
		<div class="space-y-6">
			<PostItem {post} isFullView={true} onToggleLike={handleToggleLike} />
			
			<!-- Comments Placeholder -->
			<div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-semibold text-card-foreground">Comments</h3>
				<div class="rounded-xl border border-border/50 bg-secondary/20 p-8 text-center">
					<p class="text-muted-foreground">Comments section coming soon...</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
			Post not found.
		</div>
	{/if}
</div>
