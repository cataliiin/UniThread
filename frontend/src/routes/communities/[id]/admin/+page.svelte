<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';
	import type { CommunityMember } from '$lib/types/community';

	let { data }: { data: PageData } = $props();
	let communityId = $derived(data.communityId);

	let members = $state<CommunityMember[]>([]);
	let loading = $state(true);
	let actionLoading = $state<string | null>(null); // user_id being actioned
	let communityName = $state('');
	let confirmRemove = $state<string | null>(null); // user_id pending removal confirm
	let search = $state('');

	const currentUserId = $derived(user.email);

	const filteredMembers = $derived(
		search.trim()
			? members.filter(
					(m) =>
						m.name?.toLowerCase().includes(search.toLowerCase()) ||
						m.username?.toLowerCase().includes(search.toLowerCase())
				)
			: members
	);

	onMount(async () => {
		const allCommunities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
		const community = allCommunities.find((c: { id: string; name: string }) => c.id === communityId);
		if (community) communityName = community.name;

		members = await communityState.fetchMembers(communityId);
		loading = false;
	});

	async function handlePromote(userId: string) {
		actionLoading = userId;
		await communityState.promoteToAdmin(communityId, userId);
		members = await communityState.fetchMembers(communityId);
		actionLoading = null;
	}

	async function handleRemove(userId: string) {
		actionLoading = userId;
		await communityState.removeMember(communityId, userId);
		members = await communityState.fetchMembers(communityId);
		actionLoading = null;
		confirmRemove = null;
	}

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
	<title>{communityName ? `${communityName} – Admin` : 'Admin Dashboard'} - UniThread</title>
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
					<div class="flex items-center gap-2">
						<h1 class="text-lg font-bold text-foreground">Admin Dashboard</h1>
						<span class="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">Admin</span>
					</div>
					{#if communityName}
						<p class="text-xs text-muted-foreground">{communityName}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-3xl px-6 py-6">
		<!-- Stats Row -->
		{#if !loading}
			<div class="mb-6 grid grid-cols-3 gap-3">
				<div class="rounded-xl border border-border bg-sidebar p-4 text-center">
					<p class="text-2xl font-bold text-foreground">{members.length}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">Total Members</p>
				</div>
				<div class="rounded-xl border border-border bg-sidebar p-4 text-center">
					<p class="text-2xl font-bold text-indigo-400">{members.filter((m) => m.is_admin).length}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">Admins</p>
				</div>
				<div class="rounded-xl border border-border bg-sidebar p-4 text-center">
					<p class="text-2xl font-bold text-emerald-400">{members.filter((m) => !m.is_admin).length}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">Members</p>
				</div>
			</div>
		{/if}

		<!-- Quick Links -->
		<div class="mb-6 flex gap-3">
			<a
				href="/communities/{communityId}/edit"
				class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
				</svg>
				Edit Community
			</a>
			<a
				href="/communities/{communityId}/members"
				class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
					<circle cx="9" cy="7" r="4"/>
				</svg>
				View All Members
			</a>
		</div>

		<!-- Members Management -->
		<div class="mb-3 flex items-center justify-between px-1">
			<h2 class="text-sm font-semibold text-foreground">Member Management</h2>
		</div>

		<!-- Search -->
		{#if !loading && members.length > 1}
			<div class="relative mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
					<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>
				</svg>
				<input
					id="admin-search"
					type="text"
					placeholder="Search members…"
					bind:value={search}
					class="w-full rounded-xl border border-border bg-sidebar py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
				/>
			</div>
		{/if}

		{#if loading}
			<div class="space-y-3">
				{#each [1, 2, 3] as _}
					<div class="animate-pulse flex items-center gap-3 rounded-xl border border-border bg-sidebar p-4">
						<div class="h-10 w-10 rounded-full bg-muted/40"></div>
						<div class="flex-1 space-y-2">
							<div class="h-3.5 w-1/3 rounded bg-muted/40"></div>
							<div class="h-3 w-1/4 rounded bg-muted/40"></div>
						</div>
						<div class="h-8 w-24 rounded-lg bg-muted/40"></div>
					</div>
				{/each}
			</div>

		{:else if filteredMembers.length === 0}
			<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 text-center">
				<p class="text-sm text-muted-foreground">No members found</p>
			</div>

		{:else}
			<div class="space-y-2">
				{#each filteredMembers as member (member.user_id)}
					{@const isSelf = member.user_id === currentUserId}
					{@const isBeingActioned = actionLoading === member.user_id}
					{@const isConfirmingRemove = confirmRemove === member.user_id}

					<div class="rounded-xl border transition-all duration-200
					{isConfirmingRemove ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-sidebar hover:border-border/80'}">
						<div class="flex items-center gap-3 px-4 py-3">
							<!-- Avatar -->
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm
							{member.is_admin ? 'bg-indigo-600' : 'bg-slate-700'}">
								{#if member.avatar_url}
									<img src={member.avatar_url} alt="" class="h-full w-full rounded-full object-cover" />
								{:else}
									{getInitials(member.name, member.username)}
								{/if}
							</div>

							<!-- Info -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="text-sm font-semibold text-foreground truncate">
										{member.name || member.username || member.user_id}
									</span>
									{#if member.is_admin}
										<span class="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">Admin</span>
									{/if}
									{#if isSelf}
										<span class="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">You</span>
									{/if}
								</div>
								{#if member.username}
									<p class="text-xs text-muted-foreground">@{member.username} · Joined {formatDate(member.joined_at)}</p>
								{/if}
							</div>

							<!-- Actions (hidden for self) -->
							{#if !isSelf}
								<div class="flex shrink-0 items-center gap-2">
									{#if !member.is_admin}
										<button
											onclick={() => handlePromote(member.user_id)}
											disabled={isBeingActioned}
											title="Promote to Admin"
											class="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-all hover:bg-indigo-500/20 disabled:opacity-50"
										>
											{#if isBeingActioned}
												<svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="40" stroke-dashoffset="10"/></svg>
											{:else}
												<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
													<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
												</svg>
											{/if}
											Promote
										</button>
									{/if}

									<button
										onclick={() => { confirmRemove = isConfirmingRemove ? null : member.user_id; }}
										disabled={isBeingActioned}
										title="Remove from community"
										class="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-all hover:bg-destructive/20 disabled:opacity-50"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
											<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
										</svg>
										Remove
									</button>
								</div>
							{/if}
						</div>

						<!-- Confirm Remove Banner -->
						{#if isConfirmingRemove}
							<div class="flex items-center justify-between border-t border-destructive/20 px-4 py-2.5">
								<p class="text-xs text-destructive">Remove <strong>{member.name || member.username}</strong> from the community?</p>
								<div class="flex gap-2">
									<button
										onclick={() => handleRemove(member.user_id)}
										disabled={isBeingActioned}
										class="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/80 disabled:opacity-60 flex items-center gap-1"
									>
										{#if isBeingActioned}
											<svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="40" stroke-dashoffset="10"/></svg>
										{/if}
										Confirm
									</button>
									<button
										onclick={() => (confirmRemove = null)}
										class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
									>
										Cancel
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
