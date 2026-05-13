<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api/client';
	import { toast } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { communityState } from '$lib/stores/community.svelte';
	import PostForm from '$lib/components/PostForm.svelte';

	let communities = $state<any[]>([]);
	let loading = $state(true);

	onMount(async () => {
		if (!user.isAuthenticated) {
			toast.error('Please log in to create a post.');
			goto('/login');
			return;
		}

		try {
			const myComms = await communityState.fetchMyCommunities();
			// Only allow posting in approved communities
			communities = myComms.filter(c => c.user_membership_status === 'approved' || c.owner_id === user.id);
		} catch (e: any) {
			toast.error(e.message || 'Could not load communities.');
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Create Post | UniThread</title>
</svelte:head>

<div class="container mx-auto max-w-2xl py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Create a Post</h1>
		<p class="mt-2 text-muted-foreground">Share something with your community.</p>
	</div>

	<div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
		{#if loading}
			<div class="flex justify-center py-8">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		{:else}
			<PostForm mode="create" {communities} />
		{/if}
	</div>
</div>
