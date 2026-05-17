<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { PostsService, StorageService } from '$lib/api/services';
	import { toast } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import type { Post } from '$lib/types/post';
	import PostForm from '$lib/components/PostForm.svelte';

	let { data } = $props();
	let post = $state<Post | null>(null);
	let loading = $state(true);

	onMount(async () => {

		try {
			const p = await PostsService.getPost(data.postId);
			
			// Map API response to our Post type
			post = {
				...p,
				liked: p.user_vote === 1,
				university: p.community?.name || 'Global'
			} as Post;

			if (post && post.author?.id !== user.id) {
				toast.error('You are not authorized to edit this post.');
				goto(`/posts/${post?.id}`);
			}
		} catch (e: any) {
			toast.error(e.message || 'Could not load post.');
			goto('/');
		} finally {
			loading = false;
		}
	});

	function handleSuccess() {
		toast.success('Post updated successfully!');
	}
</script>

<svelte:head>
	<title>Edit Post | UniThread</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Edit Post</h1>
		<p class="mt-2 text-muted-foreground">Modify your post's content.</p>
	</div>

	{#if loading}
		<div class="flex justify-center py-12 rounded-2xl border bg-card shadow-sm">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else if post}
		<PostForm mode="edit" {post} onSuccess={handleSuccess} />
	{/if}
</div>
