<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';
	import type { Community } from '$lib/types/community';

	let activeTab = $state<'member' | 'admin'>('member');
	let communities = $state<Community[]>([]);
	let loading = $state(true);

	const currentUserId = $derived(user.email);

	const memberCommunities = $derived(
		communities.filter(
			(c) => c.user_membership_status === 'approved' && c.owner_id !== currentUserId
		)
	);

	const adminCommunities = $derived(
		communities.filter((c) => c.owner_id === currentUserId || c.owner_id === currentUserId)
	);

	// For mock: all communities owned by user
	const ownedCommunities = $derived(communities.filter((c) => c.owner_id === currentUserId));
	// For mock: all communities member of (not owner)
	const joinedCommunities = $derived(
		communities.filter(
			(c) => c.user_membership_status === 'approved' && c.owner_id !== currentUserId
		)
	);

	const displayedCommunities = $derived(
		activeTab === 'member' ? communities : ownedCommunities
	);

	onMount(async () => {
		communities = await communityState.fetchMyCommunities();
		loading = false;
	});

	function getImageUrl(key: string | null): string | null {
		if (!key) return null;
		if (key.startsWith('local_img_')) return localStorage.getItem(key);
		return `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000/community-assets'}/${key}`;
	}

	function getRoleBadge(community: Community) {
		if (community.owner_id === currentUserId) return { label: 'Owner', color: 'indigo' };
		if (community.user_membership_status === 'approved') return { label: 'Member', color: 'green' };
		return null;
	}
</script>

<svelte:head>
	<title>My Communities – UniThread</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Page Header -->
	<div class="border-b border-border bg-sidebar px-6 py-5">
		<div class="mx-auto max-w-4xl flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-foreground">My Communities</h1>
				<p class="text-sm text-muted-foreground mt-0.5">Communities you're part of</p>
			</div>
			<a
				href="/communities/new"
				class="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:brightness-110 hover:shadow-primary/50"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 5v14M5 12h14"/>
				</svg>
				New Community
			</a>
		</div>
	</div>

	<div class="mx-auto max-w-4xl px-6 py-6">
		<!-- Tabs -->
		<div class="mb-6 flex gap-1 rounded-xl border border-border bg-sidebar p-1">
			<button
				id="tab-member"
				onclick={() => (activeTab = 'member')}
				class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
				{activeTab === 'member'
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<span class="flex items-center justify-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
					</svg>
					All My Communities
					{#if communities.length > 0}
						<span class="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">{communities.length}</span>
					{/if}
				</span>
			</button>
			<button
				id="tab-admin"
				onclick={() => (activeTab = 'admin')}
				class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
				{activeTab === 'admin'
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<span class="flex items-center justify-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.123 2.123 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
					</svg>
					Admin & Created
					{#if ownedCommunities.length > 0}
						<span class="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">{ownedCommunities.length}</span>
					{/if}
				</span>
			</button>
		</div>

		<!-- Loading State -->
		{#if loading}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each [1, 2, 3, 4] as _}
					<div class="animate-pulse rounded-2xl border border-border bg-sidebar overflow-hidden">
						<div class="h-24 bg-muted/40"></div>
						<div class="p-4 flex gap-3">
							<div class="h-12 w-12 rounded-xl bg-muted/40 shrink-0 -mt-8"></div>
							<div class="flex-1 space-y-2 pt-1">
								<div class="h-4 w-3/4 rounded bg-muted/40"></div>
								<div class="h-3 w-1/2 rounded bg-muted/40"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>

		<!-- Empty State -->
		{:else if displayedCommunities.length === 0}
			<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-sidebar/50 px-6 py-16 text-center">
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
					<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
					</svg>
				</div>
				{#if activeTab === 'member'}
					<h3 class="text-lg font-semibold text-foreground">No communities yet</h3>
					<p class="mt-1 text-sm text-muted-foreground">Join a community or create your own to get started.</p>
				{:else}
					<h3 class="text-lg font-semibold text-foreground">No communities created</h3>
					<p class="mt-1 text-sm text-muted-foreground">Create your first community and become an admin.</p>
				{/if}
				<a
					href="/communities/new"
					class="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110"
				>
					Create Community
				</a>
			</div>

		<!-- Communities Grid -->
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each displayedCommunities as community (community.id)}
					{@const role = getRoleBadge(community)}
					<a
						href="/communities/{community.id}"
						class="group relative overflow-hidden rounded-2xl border border-border bg-sidebar transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
					>
						<!-- Banner -->
						<div class="relative h-24 w-full overflow-hidden">
							{#if community.banner_key}
								<img
									src={getImageUrl(community.banner_key)}
									alt=""
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							{:else}
								<div class="h-full w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 transition-transform duration-500 group-hover:scale-105"></div>
							{/if}
							<!-- Type badge -->
							<span class="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm">
								{community.type}
							</span>
						</div>

						<!-- Content -->
						<div class="flex items-start gap-3 px-4 pb-4 pt-0">
							<!-- Icon (overlaps banner) -->
							<div class="relative -mt-6 h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-sidebar bg-slate-800 shadow-md">
								{#if community.icon_key}
									<img src={getImageUrl(community.icon_key)} alt="" class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full w-full items-center justify-center bg-indigo-600 text-lg font-bold text-white">
										{community.name.charAt(0).toUpperCase()}
									</div>
								{/if}
							</div>

							<div class="min-w-0 flex-1 pt-1">
								<div class="flex items-center gap-2">
									<h2 class="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
										{community.name}
									</h2>
									{#if role}
										<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold
										{role.color === 'indigo' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-emerald-500/15 text-emerald-400'}">
											{role.label}
										</span>
									{/if}
								</div>
								<p class="mt-0.5 text-xs text-muted-foreground">
									{community.member_count} {community.member_count === 1 ? 'member' : 'members'}
								</p>
								{#if community.description}
									<p class="mt-1 text-xs text-muted-foreground line-clamp-2">{community.description}</p>
								{/if}
							</div>
						</div>

						<!-- Hover arrow -->
						<div class="absolute bottom-4 right-4 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
								<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
							</svg>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
