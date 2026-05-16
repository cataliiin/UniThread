<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { CommunityMember } from '$lib/types/community';
	import { Button } from '$lib/components/ui/button';
	import { Shield, UserMinus, UserPlus, X, Trash2 } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { getAuthorDisplayName } from '$lib/utils/user';

	let { data }: { data: PageData } = $props();
	let communityId = $derived(data.communityId);
	let currentCommunity = $derived(communityState.currentCommunity);
	let isAdmin = $derived(communityState.isAdmin);
	let isOwner = $derived(communityState.isOwner);
	let dialogOpen = $state(false);
	let dialogTitle = $state('');
	let dialogDescription = $state('');
	let dialogAction = $state<() => void>(() => {});
	let dialogConfirmText = $state('Confirm');
	let dialogVariant = $state<'primary' | 'destructive'>('primary');

	function openConfirm(title: string, description: string, action: () => void, confirmText = 'Confirm', variant: 'primary' | 'destructive' = 'primary') {
		dialogTitle = title;
		dialogDescription = description;
		dialogAction = action;
		dialogConfirmText = confirmText;
		dialogVariant = variant;
		dialogOpen = true;
	}

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
		const [community, membersData] = await Promise.all([
			communityState.fetchCommunity(communityId),
			communityState.fetchMembers(communityId)
		]);
		if (community) {
			communityName = community.name;
		}
		members = membersData;
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

	function formatDisplayName(member: CommunityMember): string {
		return getAuthorDisplayName({
			first_name: member.name?.split(' ')[0] || null,
			last_name: member.name?.split(' ').slice(1).join(' ') || null,
			username: member.username || 'anonymous'
		});
	}

	async function handlePromote(member: CommunityMember) {
		openConfirm(
			'Promote to Admin',
			`Are you sure you want to promote ${member.username} to Admin? They will be able to manage members and moderate posts.`,
			async () => {
				const ok = await communityState.promoteToAdmin(communityId, member.user_id);
				if (ok) {
					members = await communityState.fetchMembers(communityId);
				}
			},
			'Promote',
			'primary'
		);
	}

	async function handleRemove(member: CommunityMember) {
		openConfirm(
			'Remove Member',
			`Are you sure you want to remove ${member.username} from the community?`,
			async () => {
				const ok = await communityState.removeMember(communityId, member.user_id);
				if (ok) {
					members = await communityState.fetchMembers(communityId);
				}
			},
			'Remove',
			'destructive'
		);
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
						<div class="group/item relative flex w-full items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5">
							<!-- Avatar -->
							<button 
								onclick={() => member.user_id !== 'anonymous' && goto(`/profile/${member.user_id}`)}
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md hover:brightness-110 transition-all"
							>
								{#if member.avatar_url}
									<img src={member.avatar_url} alt="" class="h-full w-full rounded-full object-cover" />
								{:else}
									{getInitials(member.name, member.username)}
								{/if}
							</button>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<button 
										onclick={() => member.user_id !== 'anonymous' && goto(`/profile/${member.user_id}`)}
										class="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors"
									>
										{formatDisplayName(member)}
									</button>
									{#if member.user_id === currentCommunity?.owner_id}
										<span class="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 border border-amber-500/20 shadow-sm shadow-amber-500/10">
											Owner
										</span>
									{:else}
										<span class="shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/10">
											Admin
										</span>
									{/if}
								</div>
								{#if member.username}
									<p class="text-xs text-muted-foreground/70">@{member.username}</p>
								{/if}
							</div>
							
							<div class="flex items-center gap-3">
								{#if isOwner && member.user_id !== user.id && member.user_id !== currentCommunity?.owner_id}
									<button
										onclick={() => handleRemove(member)}
										class="rounded-lg p-2 text-muted-foreground/50 transition-all hover:bg-destructive/10 hover:text-destructive hover:scale-110 active:scale-95"
										title="Remove Admin"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								{/if}
								<span class="shrink-0 text-[10px] font-medium text-muted-foreground/40 tabular-nums">
									{member.joined_at ? formatDate(member.joined_at) : 'N/A'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Regular Members Section -->
			{#if regularMembers.length > 0}
				<div class="mb-4 mt-8 px-1">
					<h2 class="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
						Members 
						<span class="h-px flex-1 bg-border/40"></span>
						<span class="text-[10px] tabular-nums bg-muted px-2 py-0.5 rounded-full">{regularMembers.length}</span>
					</h2>
				</div>
				<div class="space-y-2">
					{#each regularMembers as member (member.user_id)}
						<div class="group/item relative flex w-full items-center gap-3 rounded-xl border border-border bg-sidebar/40 px-4 py-3 text-left transition-all duration-300 hover:border-primary/20 hover:bg-primary/5 hover:translate-x-1">
							<button 
								onclick={() => member.user_id !== 'anonymous' && goto(`/profile/${member.user_id}`)}
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground border border-border hover:border-primary/50 transition-all duration-300 shadow-sm group-hover/item:scale-105"
							>
								{#if member.avatar_url}
									<img src={member.avatar_url} alt="" class="h-full w-full rounded-full object-cover" />
								{:else}
									{getInitials(member.name, member.username)}
								{/if}
							</button>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<button 
										onclick={() => member.user_id !== 'anonymous' && goto(`/profile/${member.user_id}`)}
										class="truncate text-sm font-medium text-foreground hover:text-primary transition-colors"
									>
										{formatDisplayName(member)}
									</button>
									<span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
										Member
									</span>
								</div>
								{#if member.username}
									<p class="text-xs text-muted-foreground/60">@{member.username}</p>
								{/if}
							</div>

							<div class="flex items-center gap-3">
								{#if isOwner}
									<button
										onclick={() => handlePromote(member)}
										class="rounded-lg p-2 text-muted-foreground/40 transition-all hover:bg-primary/10 hover:text-primary hover:scale-110 active:scale-95"
										title="Promote to Admin"
									>
										<UserPlus class="h-4 w-4" />
									</button>
								{/if}
								{#if isAdmin}
									<button
										onclick={() => handleRemove(member)}
										class="rounded-lg p-2 text-muted-foreground/40 transition-all hover:bg-destructive/10 hover:text-destructive hover:scale-110 active:scale-95"
										title="Remove Member"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								{/if}
								<span class="shrink-0 text-[10px] font-medium text-muted-foreground/30 tabular-nums">
									{member.joined_at ? formatDate(member.joined_at) : 'N/A'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if dialogOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
		onclick={() => dialogOpen = false}
		transition:fade={{ duration: 200 }}
	>
		<div 
			class="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-sidebar shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div class="p-6">
				<h2 class="text-xl font-bold text-foreground">{dialogTitle}</h2>
				<p class="mt-2 text-sm text-muted-foreground leading-relaxed">
					{dialogDescription}
				</p>
			</div>
			
			<div class="flex items-center justify-end gap-3 bg-muted/30 px-6 py-4 border-t border-border">
				<Button 
					variant="outline" 
					class="rounded-xl border-border bg-transparent hover:bg-muted"
					onclick={() => dialogOpen = false}
				>
					Cancel
				</Button>
				<Button 
					onclick={() => { dialogAction(); dialogOpen = false; }}
					variant={dialogVariant === 'destructive' ? 'destructive' : 'default'}
					class="rounded-xl font-bold shadow-lg shadow-primary/20"
				>
					{dialogConfirmText}
				</Button>
			</div>
		</div>
	</div>
{/if}
