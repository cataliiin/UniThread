<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';
	import type { CommunityMember } from '$lib/types/community';

	let { data }: { data: PageData } = $props();
	let communityId = $derived(data.communityId);

	let members = $state<CommunityMember[]>([]);
	let loading = $state(true);
	let communityName = $state('');
	let search = $state('');

	const filteredMembers = $derived(
		search.trim()
			? members.filter(
					(m) =>
						m.name?.toLowerCase().includes(search.toLowerCase()) ||
						m.username?.toLowerCase().includes(search.toLowerCase())
				)
			: members
	);

	const adminMembers = $derived(filteredMembers.filter((m) => m.is_admin));
	const regularMembers = $derived(filteredMembers.filter((m) => !m.is_admin));

	onMount(async () => {
		// Load community name from localStorage
		const allCommunities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
		const community = allCommunities.find((c: { id: string; name: string }) => c.id === communityId);
		if (community) communityName = community.name;

		members = await communityState.fetchMembers(communityId);
		loading = false;
	});

	function getInitials(name?: string, username?: string): string {
		if (name) return name.substring(0, 2).toUpperCase();
		if (username) return username.substring(0, 2).toUpperCase();
		return '??';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>{communityName ? `${communityName} – Members` : 'Members'} - UniThread</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<div class="border-b border-border bg-sidebar px-6 py-4">
		<div class="mx-auto max-w-3xl">
			<div class="flex items-center gap-3">
				<a
					href="/communities/{communityId}"
					class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Back"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m15 18-6-6 6-6"/>
					</svg>
				</a>
				<div>
					<h1 class="text-lg font-bold text-foreground">Members</h1>
					{#if communityName}
						<p class="text-xs text-muted-foreground">{communityName}</p>
					{/if}
				</div>
				{#if !loading}
					<span class="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
						{members.length} {members.length === 1 ? 'member' : 'members'}
					</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-3xl px-6 py-6">
		<!-- Search -->
		{#if !loading && members.length > 1}
			<div class="relative mb-6">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
					<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>
				</svg>
				<input
					id="members-search"
					type="text"
					placeholder="Search members…"
					bind:value={search}
					class="w-full rounded-xl border border-border bg-sidebar py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
				/>
			</div>
		{/if}

		{#if loading}
			<!-- Loading skeletons -->
			<div class="space-y-3">
				{#each [1, 2, 3, 4, 5] as _}
					<div class="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-sidebar p-4">
						<div class="h-10 w-10 rounded-full bg-muted/40"></div>
						<div class="flex-1 space-y-2">
							<div class="h-3.5 w-1/3 rounded bg-muted/40"></div>
							<div class="h-3 w-1/4 rounded bg-muted/40"></div>
						</div>
					</div>
				{/each}
			</div>

		{:else if filteredMembers.length === 0}
			<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4 text-muted-foreground/40">
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
					<circle cx="9" cy="7" r="4"/>
				</svg>
				<p class="text-sm font-medium text-muted-foreground">No members found</p>
			</div>

		{:else}
			<!-- Admins Section -->
			{#if adminMembers.length > 0}
				<div class="mb-2 px-1">
					<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Admins & Owners ({adminMembers.length})
					</h2>
				</div>
				<div class="mb-6 space-y-2">
					{#each adminMembers as member (member.user_id)}
						<div class="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
							<!-- Avatar -->
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md">
								{#if member.avatar_url}
									<img src={member.avatar_url} alt="" class="h-full w-full rounded-full object-cover" />
								{:else}
									{getInitials(member.name, member.username)}
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate text-sm font-semibold text-foreground">
										{member.name || member.username || member.user_id}
									</span>
									<span class="shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
										Admin
									</span>
								</div>
								{#if member.username}
									<p class="text-xs text-muted-foreground">@{member.username}</p>
								{/if}
							</div>
							<span class="shrink-0 text-xs text-muted-foreground">
								{formatDate(member.joined_at)}
							</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Regular Members Section -->
			{#if regularMembers.length > 0}
				<div class="mb-2 px-1">
					<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Members ({regularMembers.length})
					</h2>
				</div>
				<div class="space-y-2">
					{#each regularMembers as member (member.user_id)}
						<div class="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3 transition-colors hover:border-border/60 hover:bg-sidebar/80">
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-300">
								{#if member.avatar_url}
									<img src={member.avatar_url} alt="" class="h-full w-full rounded-full object-cover" />
								{:else}
									{getInitials(member.name, member.username)}
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<span class="truncate text-sm font-medium text-foreground">
									{member.name || member.username || member.user_id}
								</span>
								{#if member.username}
									<p class="text-xs text-muted-foreground">@{member.username}</p>
								{/if}
							</div>
							<span class="shrink-0 text-xs text-muted-foreground">
								{formatDate(member.joined_at)}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
