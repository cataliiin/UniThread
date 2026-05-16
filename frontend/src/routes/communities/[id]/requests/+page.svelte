<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { communityState } from '$lib/stores/community.svelte';
	import { Button } from '$lib/components/ui/button';
	import { toast } from '$lib/stores/toast.svelte';
	import { UserCheck, UserMinus, ShieldAlert } from 'lucide-svelte';
	import { StorageService } from '$lib/api/services';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let communityId = $derived(data.communityId);
	let communityName = $derived(communityState.currentCommunity?.name || 'Community');
	let loading = $state(true);

	onMount(async () => {
		// Fetch both community and members list in parallel to correctly resolve isAdmin role checks
		await Promise.all([
			communityState.fetchCommunity(communityId),
			communityState.fetchMembers(communityId)
		]);

		if (communityState.isAdmin) {
			await communityState.fetchJoinRequests(communityId);
		}
		loading = false;
	});

	$effect(() => {
		if (!loading && !communityState.isAdmin && communityState.currentCommunity) {
			toast.error('Access denied. Admins only.');
			goto(`/communities/${communityId}`);
		}
	});

	async function handleApprove(userId: string) {
		await communityState.approveJoinRequest(communityId, userId);
	}

	async function handleReject(userId: string) {
		await communityState.rejectJoinRequest(communityId, userId);
	}

	function getAvatarUrl(key: string | null): string {
		if (!key) return '';
		if (key.startsWith('local_img_')) return localStorage.getItem(key) || '';
		return StorageService.getPublicUrl('user-assets', key) ?? '';
	}
</script>

<svelte:head>
	<title>Pending Requests - {communityName} - UniThread</title>
</svelte:head>

<div class="min-h-screen bg-background px-4 py-8">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<a href="/communities/{communityId}" class="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m15 18-6-6 6-6"/>
					</svg>
					Back to Community
				</a>
				<h1 class="text-3xl font-extrabold tracking-tight text-foreground">
					Pending Requests
				</h1>
			</div>
			
			<div class="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
				{communityState.joinRequests.length} {communityState.joinRequests.length === 1 ? 'request' : 'requests'}
			</div>
		</div>

		<!-- Requests List -->
		<div class="space-y-4">
			{#if loading || communityState.requestsLoading}
				<div class="flex items-center justify-center rounded-2xl border border-border/50 bg-sidebar/50 p-12 shadow-sm">
					<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary"></div>
				</div>
			{:else if communityState.joinRequests.length === 0}
				<div class="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-sidebar/50 p-12 text-center shadow-sm">
					<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
						<ShieldAlert class="h-8 w-8" />
					</div>
					<h3 class="mb-1 text-lg font-bold text-foreground">No pending requests</h3>
					<p class="text-muted-foreground">You're all caught up! There are no users waiting to join.</p>
				</div>
			{:else}
				{#each communityState.joinRequests as request}
					<div class="flex flex-col items-start gap-4 rounded-2xl border border-border bg-sidebar p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
						<!-- User Info -->
						<a href="/profile/{request.user.id}" class="flex flex-1 items-center gap-4 group">
							<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-background bg-primary/10 shadow-sm ring-2 ring-primary/20 transition-all group-hover:ring-primary/50 sm:h-14 sm:w-14">
								{#if request.user.avatar_key}
									<img src={getAvatarUrl(request.user.avatar_key)} alt={request.user.username} class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-primary-foreground sm:text-base">
										{request.user.username.substring(0, 2).toUpperCase()}
									</div>
								{/if}
							</div>
							<div class="flex min-w-0 flex-col">
								<h3 class="truncate text-base font-bold text-foreground group-hover:text-primary transition-colors sm:text-lg">
									{request.user.username.includes('.') 
										? request.user.username.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
										: request.user.username}
								</h3>
								<p class="truncate text-sm text-muted-foreground">@{request.user.username}</p>
							</div>
						</a>

						<!-- Actions -->
						<div class="flex w-full items-center gap-2 sm:w-auto">
							<Button 
								variant="outline" 
								onclick={() => handleReject(request.user.id)}
								class="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600 sm:flex-none"
							>
								<UserMinus class="mr-2 h-4 w-4" />
								Decline
							</Button>
							<Button 
								onclick={() => handleApprove(request.user.id)}
								class="flex-1 bg-green-600 font-bold hover:bg-green-700 sm:flex-none shadow-md shadow-green-600/20"
							>
								<UserCheck class="mr-2 h-4 w-4" />
								Approve
							</Button>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
