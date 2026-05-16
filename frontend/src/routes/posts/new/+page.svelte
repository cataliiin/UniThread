<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { communityState } from '$lib/stores/community.svelte';
	import { page } from '$app/stores';
	import PostForm from '$lib/components/PostForm.svelte';

	let communities = $state<any[]>([]);
	let loading = $state(true);

	// Get default community from URL if present
	let defaultCommunityId = $derived($page.url.searchParams.get('communityId'));

	onMount(async () => {
		try {
			const myComms = await communityState.fetchMyCommunities();
			// Only allow posting in approved communities
			communities = myComms.filter(
				(c) => c.user_membership_status === 'approved' || c.owner_id === user.id
			);
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

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Create a Post</h1>
		<p class="mt-2 text-muted-foreground">Share something with your community.</p>
	</div>

	<div class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
		{#if loading}
			<div class="flex justify-center py-8">
				<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
			</div>
		{:else}
			<PostForm mode="create" {communities} {defaultCommunityId} />
		{/if}
	</div>
</div>
