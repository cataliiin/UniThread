<script lang="ts">
	import { onMount } from 'svelte';
	import { PostsService } from '$lib/api/services/PostsService';
	import type { Post } from '$lib/types/post';
	import PostItem from '$lib/components/PostItem.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { CommentsService, type CommentResponse } from '$lib/api/services/CommentsService';
	import CommentItem from '$lib/components/CommentItem.svelte';
	import { user as userStore } from '$lib/stores/user.svelte';
	import { Loader2, Send } from 'lucide-svelte';

	import { getAuthorDisplayName } from '$lib/utils/user';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data } = $props();

	const p = data.post;
	let post = $state<Post>({
		id: p.id,
		title: p.title,
		authorId: p.author?.id || 'anonymous',
		authorName: getAuthorDisplayName(p.author),
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

	let comments = $state<CommentResponse[]>([]);
	let commentsLoading = $state(true);
	let newCommentBody = $state('');
	let submitting = $state(false);

	// Confirm Dialog state
	let confirmOpen = $state(false);
	let commentToDelete = $state<string | null>(null);

	onMount(async () => {
		await loadComments();
	});

	async function loadComments() {
		commentsLoading = true;
		try {
			comments = await CommentsService.listComments(post.id.toString());
			post.comments = comments.length;
		} catch (e) {
			console.error('Failed to load comments:', e);
			toast.error('Could not load comments.');
		} finally {
			commentsLoading = false;
		}
	}

	async function handleAddComment() {
		if (!newCommentBody.trim() || submitting) return;
		if (!userStore.isAuthenticated) {
			toast.error('You must be logged in to comment.');
			return;
		}

		submitting = true;
		try {
			const newComment = await CommentsService.createComment(post.id.toString(), {
				body: newCommentBody.trim()
			});
			comments = [...comments, newComment];
			post.comments = comments.length;
			newCommentBody = '';
			toast.success('Comment added!');
		} catch (e: any) {
			console.error('Failed to add comment:', e);
			toast.error(e.message || 'Failed to post comment.');
		} finally {
			submitting = false;
		}
	}

	function confirmDeleteComment(commentId: string) {
		commentToDelete = commentId;
		confirmOpen = true;
	}

	async function handleDeleteComment() {
		if (!commentToDelete) return;

		try {
			await CommentsService.deleteComment(post.id.toString(), commentToDelete);
			comments = comments.filter((c) => c.id !== commentToDelete);
			post.comments = comments.length;
			toast.success('Comment deleted.');
		} catch (e) {
			console.error('Failed to delete comment:', e);
			toast.error('Failed to delete comment.');
		} finally {
			commentToDelete = null;
		}
	}

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
	<title>{post.title} | UniThread</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<button
		class="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
		onclick={() => history.back()}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m15 18-6-6 6-6" />
		</svg>
		Back
	</button>

	<div class="space-y-8">
		<PostItem {post} isFullView={true} onToggleLike={handleToggleLike} />

		<div class="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
			<div class="border-b border-border p-4 px-6 bg-secondary/10">
				<h3 class="text-lg font-bold text-card-foreground flex items-center gap-2">
					Comments
					<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
						{post.comments}
					</span>
				</h3>
			</div>

			<div class="p-6">
				<!-- Comment Form -->
				{#if userStore.isAuthenticated}
					<div class="mb-8 flex gap-4">
						<div class="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
							{userStore.username.charAt(0).toUpperCase()}
						</div>
						<div class="flex-1 space-y-3">
							<textarea
								bind:value={newCommentBody}
								placeholder="Add a comment..."
								class="w-full min-h-[100px] rounded-xl border border-border bg-secondary/20 p-4 text-sm text-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5"
							></textarea>
							<div class="flex justify-end">
								<button
									onclick={handleAddComment}
									disabled={!newCommentBody.trim() || submitting}
									class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none"
								>
									{#if submitting}
										<Loader2 class="h-4 w-4 animate-spin" />
										Posting...
									{:else}
										<Send class="h-4 w-4" />
										Post Comment
									{/if}
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="mb-8 rounded-xl border border-dashed border-border p-6 text-center">
						<p class="text-sm text-muted-foreground">
							Please <a href="/login" class="font-bold text-primary hover:underline">sign in</a> to join the conversation.
						</p>
					</div>
				{/if}

				<!-- Comments List -->
				<div class="space-y-2">
					{#if commentsLoading}
						<div class="flex flex-col items-center justify-center py-12 space-y-4">
							<Loader2 class="h-8 w-8 animate-spin text-primary/40" />
							<p class="text-sm text-muted-foreground">Loading comments...</p>
						</div>
					{:else if comments.length === 0}
						<div class="rounded-xl border border-border/50 bg-secondary/5 p-12 text-center">
							<p class="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
						</div>
					{:else}
						<div class="divide-y divide-border/40">
							{#each comments as comment (comment.id)}
								<CommentItem {comment} onDelete={confirmDeleteComment} />
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete Comment"
	description="Are you sure you want to delete this comment? This action cannot be undone."
	confirmText="Delete"
	variant="destructive"
	onConfirm={handleDeleteComment}
/>
