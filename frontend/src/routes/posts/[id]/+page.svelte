<script lang="ts">
	import { PostsService } from '$lib/api/services/PostsService';
	import type { Post } from '$lib/types/post';
	import PostItem from '$lib/components/PostItem.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let { data } = $props();

	const p = data.post;
	let post = $state<Post>({
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
		university: p.community?.name || 'Global',
		communityId: p.community?.id,
		communityName: p.community?.name
	});

	async function handleToggleLike(id: string | number) {
		const newValue = post.liked ? 0 : 1;

		// Optimistic update
		post.liked = !post.liked;
		post.likes = post.liked ? post.likes + 1 : post.likes - 1;

		try {
			await PostsService.votePost(id.toString(), newValue);
		} catch (e) {
			console.error('Failed to vote:', e);
			// Revert on failure
			post.liked = !post.liked;
			post.likes = post.liked ? post.likes + 1 : post.likes - 1;
			toast.error('Failed to vote on post.');
		}
	}
</script>

<svelte:head>
	<title>Post by {post.authorName} | UniThread</title>
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
</div>
