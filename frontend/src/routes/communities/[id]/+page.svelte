<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { invitationsState } from '$lib/stores/invitations.svelte';
	import { CommunityAdminService, StorageService, SearchService } from '$lib/api/services';
	import { api } from '$lib/api/client';
	import Feed from '$lib/components/Feed.svelte';
	import CreatePostModal from '$lib/components/CreatePostModal.svelte';
	import { Link2, X, Copy, Trash2, Loader2, Plus, Search, UserPlus } from 'lucide-svelte';
	import type { components } from '$lib/api/openapi-generated-schema';

	type CommunityInviteLinkResponse = components['schemas']['CommunityInviteLinkResponse'];

	let { data }: { data: PageData } = $props();

	let community = $derived(data.community);
	let isAdmin = $derived(communityState.isAdmin);
	let isOwner = $derived(communityState.isOwner);
	let userRole = $derived(communityState.userRole);
	let pendingInvitation = $derived(
		invitationsState.invitations.find(
			(inv) => inv.community_id === community?.id && inv.status === 'pending'
		)
	);

	let menuOpen = $state(false);
	let leaveConfirm = $state(false);
	let deleteConfirm = $state(false);
	let leavingLoading = $state(false);
	let deletingLoading = $state(false);
	let showInviteLinksModal = $state(false);
	let inviteLinks = $state<CommunityInviteLinkResponse[]>([]);
	let linksLoading = $state(false);
	let creatingLink = $state(false);
	let modalOpen = $state(false);

	// Direct Invitation States
	let activeInviteTab = $state<'links' | 'direct'>('links');
	let searchUserQuery = $state('');
	let searchedUsers = $state<any[]>([]);
	let searchLoading = $state(false);
	let invitingUsers = $state<Record<string, boolean>>({});
	let invitedUserIds = $state<Set<string>>(new Set());

	let searchDebounceTimeout: any;

	function searchUsers() {
		if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
		if (searchUserQuery.trim().length < 2) {
			searchedUsers = [];
			return;
		}

		searchLoading = true;
		searchDebounceTimeout = setTimeout(async () => {
			try {
				const res = await SearchService.globalSearch(searchUserQuery, 'users', 10);
				searchedUsers = res.users || [];
			} catch (err) {
				console.error(err);
			} finally {
				searchLoading = false;
			}
		}, 300);
	}

	async function sendDirectInvite(userId: string) {
		if (!community) return;
		invitingUsers[userId] = true;
		try {
			await CommunityAdminService.createDirectInvitation(community.id, {
				invited_user: userId
			});
			const nextSet = new Set(invitedUserIds);
			nextSet.add(userId);
			invitedUserIds = nextSet;
			toasts.show('Invitation sent successfully!', 'success');
		} catch (error: any) {
			toasts.show(error.message || 'Failed to send invitation', 'error');
		} finally {
			invitingUsers[userId] = false;
		}
	}

	function getImageUrl(key: string | null): string | null {
		if (!key) return null;
		if (key.startsWith('local_img_')) return localStorage.getItem(key);
		return StorageService.getPublicUrl('community-assets', key);
	}

	async function handleJoin() {
		if (!community) return;
		const ok = await communityState.joinCommunity(community.id);
		if (ok) {
			await invalidateAll();
		}
	}

	async function handleLeave() {
		if (!community) return;
		leavingLoading = true;
		const ok = await communityState.leaveCommunity(community.id);
		leavingLoading = false;
		if (ok) {
			closeMenu();
			goto('/communities');
		}
	}

	function closeMenu() {
		menuOpen = false;
		leaveConfirm = false;
		deleteConfirm = false;
	}

	async function loadInviteLinks() {
		if (!community) return;
		linksLoading = true;
		try {
			inviteLinks = await CommunityAdminService.listInviteLinks(community.id);
		} catch (error: any) {
			toasts.show('Failed to load invite links', 'error');
		} finally {
			linksLoading = false;
		}
	}

	async function createInviteLink() {
		if (!community) return;
		creatingLink = true;
		try {
			await CommunityAdminService.createInviteLink(community.id, {});
			await loadInviteLinks();
			toasts.show('Invite link created!', 'success');
		} catch (error: any) {
			toasts.show('Failed to create invite link', 'error');
		} finally {
			creatingLink = false;
		}
	}

	async function deleteInviteLink(linkId: string) {
		if (!community) return;
		try {
			await CommunityAdminService.deleteInviteLink(community.id, linkId);
			await loadInviteLinks();
			toasts.show('Invite link deleted', 'success');
		} catch (error: any) {
			toasts.show('Failed to delete invite link', 'error');
		}
	}

	function copyInviteLink(code: string) {
		const link = `${window.location.origin}/invite/${code}`;
		navigator.clipboard.writeText(link);
		toasts.show('Invite link copied to clipboard!', 'success');
	}

	async function loadDirectInvitations() {
		if (!community) return;
		try {
			const invites = await CommunityAdminService.listDirectInvitations(community.id);
			const newSet = new Set<string>();
			for (const invite of invites) {
				if (invite.status === 'pending') {
					newSet.add(invite.invited_user);
				}
			}
			invitedUserIds = newSet;
		} catch (err) {
			console.error('Failed to load direct invitations:', err);
		}
	}

	function openInviteLinksModal() {
		showInviteLinksModal = true;
		loadInviteLinks();
		loadDirectInvitations();
		closeMenu();
	}

	onMount(async () => {
		if (community) {
			// Fetch community details, members list, and myCommunities in parallel
			await Promise.all([
				communityState.fetchCommunity(community.id),
				communityState.fetchMembers(community.id),
				communityState.fetchMyCommunities(),
				invitationsState.fetchInvitations()
			]);
			
			// After members are loaded, communityState.isAdmin correctly reflects admin rights
			if (communityState.isAdmin && community.type !== 'public') {
				await communityState.fetchJoinRequests(community.id);
			}
		}
	});

	async function handleDeleteCommunity() {
		if (!community) return;
		deletingLoading = true;
		try {
			const { error } = await api.DELETE('/api/v1/communities/{community_id}', {
				params: { path: { community_id: community.id } }
			});
			if (error) throw error;
			toasts.show('Community deleted successfully', 'success');
			goto('/communities');
		} catch (error: any) {
			toasts.show(error.message || 'Failed to delete community', 'error');
		} finally {
			deletingLoading = false;
			closeMenu();
		}
	}

	let refreshFeed = $state<() => void>();

	function handlePostSuccess() {
		refreshFeed?.();
		toasts.show('Post created successfully!', 'success');
	}
</script>

<svelte:head>
	<title>{community ? `${community.name} - Community` : 'Community'} - UniThread</title>
</svelte:head>

<!-- Click outside overlay -->
{#if menuOpen}
	<button
		class="fixed inset-0 z-20"
		onclick={closeMenu}
		aria-label="Close menu"
	></button>
{/if}

<div class="min-h-screen bg-background">
	{#if community}
		<!-- Banner -->
		<div class="relative h-52 w-full overflow-hidden">
			{#if community.banner_key}
				<img
					src={getImageUrl(community.banner_key)}
					alt="{community.name} banner"
					class="h-full w-full object-cover"
				/>
			{:else}
				<div class="h-full w-full bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
			{/if}
			<!-- Dark gradient overlay bottom -->
			<div class="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent"></div>
		</div>

		<div class="mx-auto max-w-4xl px-4">
			<!-- Community Header -->
			<div class="relative -mt-16 mb-6 flex flex-col md:flex-row items-start md:items-end gap-4 text-left">
				<!-- Top row: Icon + Name & Meta side-by-side on all screens -->
				<div class="flex items-end gap-4 w-full md:w-auto">
					<!-- Icon -->
					<div class="h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-xl">
						{#if community.icon_key}
							<img src={getImageUrl(community.icon_key)} alt="{community.name} icon" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-indigo-600 text-3xl sm:text-4xl font-bold text-white">
								{community.name.charAt(0).toUpperCase()}
							</div>
						{/if}
					</div>

					<!-- Name & Meta -->
					<div class="mb-2 min-w-0 flex-1">
						<div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
							<h1 class="text-xl sm:text-2xl font-bold text-foreground break-all leading-tight">{community.name}</h1>
							<div class="flex items-center gap-2">
								{#if isOwner}
									<span class="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">Owner</span>
								{:else if isAdmin}
									<span class="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">Admin</span>
								{:else if userRole === 'member'}
									<span class="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">Member</span>
								{/if}
							</div>
						</div>
						<p class="mt-1 text-xs sm:text-sm text-muted-foreground">{community.member_count} members</p>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="mb-2 flex flex-wrap justify-start items-center gap-2 w-full md:w-auto mt-2 md:mt-0 md:ml-auto">
					{#if !community.user_membership_status}
						{#if community.type === 'public'}
							<button
								onclick={handleJoin}
								disabled={communityState.loading}
								class="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 disabled:opacity-70"
							>
								{#if communityState.loading}
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
									Joining...
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M5 12h14m-7-7v14"/>
									</svg>
									Join
								{/if}
							</button>
						{:else if community.type === 'request'}
							<button
								onclick={handleJoin}
								disabled={communityState.loading}
								class="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 disabled:opacity-70"
							>
								{#if communityState.loading}
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"></div>
									Applying...
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
										<circle cx="9" cy="7" r="4"/>
										<path d="M19 8v6m-3-3h6"/>
									</svg>
									Apply to Join
								{/if}
							</button>

						{/if}
					{:else if (community.user_membership_status === 'approved' || isAdmin || isOwner)}
						<!-- Create Post Button (Popup) -->
						<button
							onclick={() => (modalOpen = true)}
							class="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110"
						>
							<Plus class="h-4 w-4 stroke-[2.5]" />
							Create Post
						</button>
					{:else if community.user_membership_status === 'pending'}
						<div class="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-500">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
							</svg>
							Pending Approval
						</div>
					{/if}

					<!-- Members Button -->
					{#if community.type === 'public' || community.type === 'request' || community.user_membership_status === 'approved' || isOwner || (community.type === 'invite' && pendingInvitation)}
						<a
							href="/communities/{community.id}/members"
							id="btn-members"
							class="flex items-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
						>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
						</svg>
						Members
					</a>
					{/if}

					<!-- Requests Button (Admin Only) -->
					{#if isAdmin && community.type !== 'public'}
						<a
							href="/communities/{community.id}/requests"
							class="relative flex items-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
								<circle cx="9" cy="7" r="4"/>
								<line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
							</svg>
							Requests
							{#if communityState.joinRequests.length > 0}
								<span class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
									{communityState.joinRequests.length}
								</span>
							{/if}
						</a>
					{/if}

					<!-- 3-dot Menu -->
					<div class="relative z-30">
						<button
							id="btn-community-menu"
							onclick={() => { menuOpen = !menuOpen; leaveConfirm = false; deleteConfirm = false; }}
							class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-sidebar text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
							aria-label="More options"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
							</svg>
						</button>

						{#if menuOpen}
							<div class="absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/20">
								{#if isOwner}
									<button
										onclick={() => { goto(`/communities/${community.id}/edit`); closeMenu(); }}
										class="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
										</svg>
										Community Options
									</button>

									{#if !deleteConfirm}
										<button
											onclick={() => (deleteConfirm = true)}
											class="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-500/10"
										>
											<Trash2 class="h-3.75 w-3.75" />
											Delete Community
										</button>
									{:else}
										<div class="px-4 py-3">
											<p class="text-xs text-muted-foreground mb-3">Are you sure? This cannot be undone.</p>
											<div class="flex gap-2">
												<button
													onclick={handleDeleteCommunity}
													disabled={deletingLoading}
													class="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/80 disabled:opacity-60"
												>
													{deletingLoading ? 'Deleting…' : 'Yes, Delete'}
												</button>
												<button
													onclick={() => (deleteConfirm = false)}
													class="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
												>
													Cancel
												</button>
											</div>
										</div>
									{/if}
									<div class="my-1 border-t border-border"></div>
								{/if}

								{#if isAdmin}
									<button
										onclick={openInviteLinksModal}
										class="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
									>
										<UserPlus class="h-3.75 w-3.75" />
										Invite Members
									</button>
									<div class="my-1 border-t border-border"></div>
								{/if}

								{#if !isOwner && community.user_membership_status === 'approved'}
									{#if !leaveConfirm}
										<button
											onclick={() => (leaveConfirm = true)}
											class="flex w-full items-center gap-3 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
												<polyline points="16 17 21 12 16 7"/>
												<line x1="21" x2="9" y1="12" y2="12"/>
											</svg>
											Leave Community
										</button>
									{:else}
										<div class="px-4 py-3">
											<p class="text-xs text-muted-foreground mb-3">Are you sure you want to leave?</p>
											<div class="flex gap-2">
												<button
													onclick={handleLeave}
													disabled={leavingLoading}
													class="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/80 disabled:opacity-60"
												>
													{leavingLoading ? 'Leaving…' : 'Yes, Leave'}
												</button>
												<button
													onclick={() => (leaveConfirm = false)}
													class="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
												>
													Cancel
												</button>
											</div>
										</div>
									{/if}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Description -->
			{#if community.description}
				<div class="mb-6 rounded-xl border border-border bg-sidebar/60 p-4">
					<p class="wrap-break-word text-sm text-muted-foreground leading-relaxed">{community.description}</p>
				</div>
			{/if}

			<!-- Settings Info Pills -->
			<div class="mb-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
				{#if community.allow_anonymous}
					<span class="flex items-center gap-1.5 rounded-full border border-border bg-sidebar px-3 py-1.5">
						<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
						</svg>
						Anonymous posts allowed
					</span>
				{/if}
				<span class="flex items-center gap-1.5 rounded-full border border-border bg-sidebar px-3 py-1.5 capitalize">
					<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
					{community.type}
				</span>
			</div>


			<!-- Posts Feed -->
			<div class="mt-8">
				{#if community.type === 'public' || community.user_membership_status === 'approved' || isOwner}
					<Feed communityId={community.id} bind:refresh={refreshFeed} />
				{:else}
					<div class="rounded-xl border border-border bg-sidebar/40 p-12 text-center">
						<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
								<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
							</svg>
						</div>
						{#if community.type === 'invite' && pendingInvitation}
							<h3 class="text-lg font-semibold text-foreground">You are invited to join this community</h3>
							<p class="mt-2 text-sm text-muted-foreground">Accept the invitation to view posts and participate.</p>
							<div class="mt-6 flex justify-center gap-3">
								<button
									onclick={async () => {
										if (!pendingInvitation) return;
										const ok = await invitationsState.acceptInvitation(pendingInvitation.id);
										if (ok) await invalidateAll();
									}}
									class="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110"
								>
									Accept Invitation
								</button>
								<button
									onclick={async () => {
										if (!pendingInvitation) return;
										const ok = await invitationsState.declineInvitation(pendingInvitation.id);
										if (ok) goto('/communities');
									}}
									class="rounded-xl border border-border bg-sidebar/60 px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
								>
									Decline
								</button>
							</div>
						{:else}
							<h3 class="text-lg font-semibold text-foreground">This community is private</h3>
							<p class="mt-2 text-sm text-muted-foreground">
								{#if community.type === 'invite'}
									Joining this community requires a direct invitation.
								{:else}
									You must be an approved member to see posts.
								{/if}
							</p>
							{#if !community.user_membership_status && community.type !== 'invite'}
								<button
									onclick={handleJoin}
									class="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110"
								>
									Apply to Join
								</button>
							{/if}

							<!-- Premium Members Preview for request communities or when invited -->
							{#if communityState.members && communityState.members.length > 0}
								<div class="mt-6 border-t border-border/60 pt-6">
									<p class="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">Community Members</p>
									<div class="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
										{#each communityState.members.slice(0, 8) as m}
											<a 
												href="/profile/{m.user_id}" 
												class="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-all duration-300 hover:scale-110 hover:border-primary" 
												title={m.name || m.username}
											>
												{#if m.avatar_url}
													<img src={m.avatar_url} alt="" class="h-full w-full object-cover" />
												{:else}
													<span class="text-xs font-bold text-foreground">
														{(m.name || m.username).charAt(0).toUpperCase()}
													</span>
												{/if}
											</a>
										{/each}
										{#if communityState.members.length > 8}
											<div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border text-xs font-bold text-muted-foreground">
												+{communityState.members.length - 8}
											</div>
										{/if}
									</div>
									<a href="/communities/{community.id}/members" class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
										View all members →
									</a>
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex h-screen items-center justify-center">
			<div class="text-center">
				<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
				<p class="mt-4 text-sm text-muted-foreground">Loading community…</p>
			</div>
	</div>
{/if}

<CreatePostModal 
	communityId={community?.id} 
	communities={communityState.myCommunities} 
	bind:open={modalOpen} 
	onSuccess={handlePostSuccess}
/>
</div>

<!-- Invite & Share Modal -->
{#if showInviteLinksModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 pb-4">
				<h2 class="flex items-center gap-2 text-lg font-bold text-foreground">
					<UserPlus class="h-5 w-5 text-primary" />
					Invite to Community
				</h2>
				<button
					onclick={() => {
						showInviteLinksModal = false;
						inviteLinks = [];
						searchUserQuery = '';
						searchedUsers = [];
					}}
					class="text-muted-foreground transition-colors hover:text-foreground p-1 rounded-lg hover:bg-muted"
					aria-label="Close"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Tab Selectors -->
			<div class="flex border-b border-border px-6">
				<button
					onclick={() => activeInviteTab = 'links'}
					class="flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 {activeInviteTab === 'links' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					Invite Links
				</button>
				<button
					onclick={() => {
						activeInviteTab = 'direct';
						loadDirectInvitations();
					}}
					class="flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 {activeInviteTab === 'direct' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				>
					Direct Invitations
				</button>
			</div>

			<!-- Body -->
			<div class="p-6">
				{#if activeInviteTab === 'links'}
					<div class="space-y-4">
						<button
							onclick={createInviteLink}
							disabled={creatingLink || linksLoading}
							class="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60 shadow-lg shadow-primary/20"
						>
							{#if creatingLink}
								<Loader2 class="mr-2 h-4 w-4 animate-spin inline" />
								Creating...
							{:else}
								+ Generate New Link
							{/if}
						</button>

						<div class="space-y-3 max-h-64 overflow-y-auto pr-1">
							{#if linksLoading}
								<div class="flex items-center justify-center py-8">
									<div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
								</div>
							{:else if inviteLinks.length === 0}
								<p class="text-sm text-muted-foreground text-center py-6">
									No invite links yet. Create one to share!
								</p>
							{:else}
								{#each inviteLinks as link (link.id)}
									<div class="rounded-xl border border-border bg-sidebar/40 p-3.5 flex flex-col gap-2">
										<div class="flex items-start justify-between gap-2">
											<div class="flex-1 min-w-0">
												<code class="text-xs font-mono text-foreground break-all select-all bg-muted px-1.5 py-0.5 rounded">
													{link.code}
												</code>
												<p class="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
													<span>Used {link.use_count}</span>
													{#if link.max_uses}
														<span class="text-muted-foreground/50">•</span>
														<span>Max uses: {link.max_uses}</span>
													{/if}
												</p>
											</div>
											<div class="flex items-center gap-1">
												<button
													onclick={() => copyInviteLink(link.code)}
													class="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-muted"
													title="Copy link"
												>
													<Copy class="h-4 w-4" />
												</button>
												<button
													onclick={() => deleteInviteLink(link.id)}
													class="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-muted"
													title="Delete link"
												>
													<Trash2 class="h-4 w-4" />
												</button>
											</div>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{:else}
					<!-- Direct Invitation Search -->
					<div class="space-y-4">
						<div class="relative">
							<Search class="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search students to invite..."
								bind:value={searchUserQuery}
								oninput={searchUsers}
								class="w-full rounded-xl border border-border bg-sidebar/50 pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden transition-all placeholder:text-muted-foreground"
							/>
						</div>

						<div class="space-y-3 max-h-64 overflow-y-auto pr-1">
							{#if searchLoading}
								<div class="flex items-center justify-center py-8">
									<Loader2 class="h-6 w-6 animate-spin text-primary" />
								</div>
							{:else if searchedUsers.length === 0}
								{#if searchUserQuery.trim().length >= 2}
									<p class="text-xs text-muted-foreground text-center py-8">
										No students found matching "{searchUserQuery}"
									</p>
								{:else}
									<div class="text-center py-8 px-4 text-muted-foreground">
										<Search class="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
										<p class="text-xs">Search for users in your university to invite them directly.</p>
									</div>
								{/if}
							{:else}
								{#each searchedUsers as u (u.id)}
									<div class="flex items-center justify-between rounded-xl border border-border bg-sidebar/40 p-3">
										<div class="flex items-center gap-3">
											<div class="h-9 w-9 overflow-hidden rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-foreground text-sm shrink-0">
												{#if u.avatar_key}
													<img src={getImageUrl(u.avatar_key)} alt="" class="h-full w-full object-cover" />
												{:else}
													<span>{u.first_name ? u.first_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}</span>
												{/if}
											</div>
											<div class="text-left min-w-0">
												<p class="text-xs font-semibold text-foreground truncate">
													{u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
												</p>
												<p class="text-[10px] text-muted-foreground truncate">@{u.username}</p>
											</div>
										</div>
										<button
											onclick={() => sendDirectInvite(u.id)}
											disabled={invitingUsers[u.id] || invitedUserIds.has(u.id)}
											class="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-60 transition-all shrink-0"
										>
											{#if invitingUsers[u.id]}
												<Loader2 class="h-3 w-3 animate-spin inline" />
											{:else if invitedUserIds.has(u.id)}
												Invited
											{:else}
												Invite
											{/if}
										</button>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
