<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Mail, Shield, Calendar, UserPlus, MessageSquare, X, Loader2 } from '@lucide/svelte';
	import { user as currentUserStore } from '$lib/stores/user.svelte';
	import { communityState } from '$lib/stores/community.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { CommunityAdminService } from '$lib/api/services';
	import { api } from '$lib/api/client';
	import type { Community } from '$lib/types/community';

	let { data }: { data: PageData } = $props();

	let targetUser = $derived(data.targetUser);
	let currentUser = $derived.by(() => currentUserStore);
	let isMe = $derived(currentUser && currentUser.isAuthenticated && currentUser.id === targetUser.id);
	let myAdminCommunities = $state<Community[]>([]);
	let showInviteModal = $state(false);
	let inviteLoading = $state(false);
	let selectedCommunity = $state<string | null>(null);
	
	let displayName = $derived.by(() => {
		const u = targetUser as any;
		if (u.first_name || u.last_name) {
			return [u.first_name, u.last_name].filter(Boolean).join(' ');
		}
		
		if (targetUser.username.includes('.')) {
			return targetUser.username.split('.')
				.map(part => part.charAt(0).toUpperCase() + part.slice(1))
				.join(' ');
		}
		return targetUser.username;
	});

	let initials = $derived.by(() => {
		const u = targetUser as any;
		if (u.first_name && u.last_name) {
			return (u.first_name[0] + u.last_name[0]).toUpperCase();
		}
		return targetUser.username.substring(0, 2).toUpperCase();
	});
	let memberSince = $derived(new Date(targetUser.created_at).toLocaleString('en-US', { month: 'long', year: 'numeric' }));

	onMount(async () => {
		if (!isMe && currentUser?.isAuthenticated) {
			const allCommunities = await communityState.fetchMyCommunities();
			myAdminCommunities = allCommunities.filter(c => {
				// Check if current user is owner or admin
				const isOwner = c.owner_id === currentUser.id;
				// For now, we'll assume any community the user fetched is one they're part of
				// In a real scenario, you'd check membership status
				return isOwner || c.user_membership_status === 'approved';
			});
		}
	});

	function handleFollow() {
		toasts.show(`Following ${targetUser.username} (feature coming soon)`, 'success');
	}

	function handleMessage() {
		toasts.show(`Messaging ${targetUser.username} (feature coming soon)`, 'success');
	}

	async function handleInvite() {
		if (!selectedCommunity) return;
		inviteLoading = true;
		
		try {
			await api.POST('/api/v1/communities/{community_id}/invitations', {
				params: { path: { community_id: selectedCommunity } },
				body: { invited_user: targetUser.id }
			});
			toasts.show(`Invitation sent to ${displayName}!`, 'success');
			showInviteModal = false;
			selectedCommunity = null;
		} catch (error: any) {
			const message = error.message || '';
			
			// Backend returns 409 Conflict in several cases:
			// 1. User is already a member ("already a member")
			// 2. A pending invitation already exists ("already exists")
			// 3. Database unique constraint violation (e.g. they previously declined) ("database conflict")
			if (message.includes('already a member')) {
				toasts.show(`${displayName} is already a member of this community.`, 'info');
			} else if (message.includes('already exists')) {
				toasts.show(`A pending invitation for ${displayName} already exists.`, 'info');
			} else if (message.includes('database conflict')) {
				toasts.show(`${displayName} was previously invited and cannot be directly re-invited. Try sending them a general invite link instead!`, 'warning', 6000);
			} else if (message.includes('403')) {
				toasts.show('You need admin permissions to invite users to this community.', 'error');
			} else {
				toasts.show(message || 'Failed to send invitation', 'error');
			}
		} finally {
			inviteLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{targetUser.username}'s Profile - UniThread</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6">
	<Card.Root
		class="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border-border bg-card/95 shadow-[0_0_40px_rgba(50,65,95,0.15)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(50,65,95,0.25)]"
	>
		<div class="custom-scrollbar overflow-y-auto pt-8 pb-6 px-6">
			<div class="mb-6 text-center sm:mb-8">
				<!-- Avatar Section -->
				<div class="mx-auto mb-6 flex justify-center">
					<UserAvatar
						src={targetUser.avatar_key}
						{initials}
						size="lg"
						className="ring-4 ring-border shadow-xl"
					/>
				</div>

				<!-- Names -->
				<h1 class="m-0 px-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
					{displayName}
				</h1>
				{#if displayName !== "@" + targetUser.username && displayName !== targetUser.username}
					<p class="mt-1 text-sm font-medium text-muted-foreground sm:text-base">@{targetUser.username}</p>
				{/if}

				<!-- Profile Actions -->
				{#if !isMe}
					<div class="mt-6 flex items-center justify-center gap-3">
						{#if myAdminCommunities.length > 0}
							<Button 
								onclick={() => showInviteModal = true}
								class="flex-1 bg-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
							>
								<UserPlus class="mr-2 h-4 w-4" />
								Invite
							</Button>
						{:else}
							<Button 
								onclick={handleFollow}
								class="flex-1 bg-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
							>
								<UserPlus class="mr-2 h-4 w-4" />
								Follow
							</Button>
						{/if}
						<Button 
							variant="outline" 
							onclick={handleMessage}
							class="flex-1 border-border font-bold hover:bg-secondary"
						>
							<MessageSquare class="mr-2 h-4 w-4" />
							Message
						</Button>
					</div>
				{:else}
					<div class="mt-6">
						<Button 
							href="/profile"
							variant="outline"
							class="w-full border-primary/30 bg-primary/5 font-bold text-primary hover:bg-primary/10"
						>
							Edit My Profile
						</Button>
					</div>
				{/if}
			</div>

			<Card.Content class="space-y-4 p-0 sm:space-y-6">
				<!-- Info List -->
				<div class="flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-secondary/50 sm:gap-5">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
						<Shield class="h-5 w-5" />
					</div>
					<div class="flex min-w-0 flex-col">
						<span class="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[10px]">
							University
						</span>
						<span class="text-sm font-medium text-foreground sm:text-base">Transilvania University of Brașov</span>
					</div>
				</div>

				<div class="flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-secondary/50 sm:gap-5">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
						<Calendar class="h-5 w-5" />
					</div>
					<div class="flex min-w-0 flex-col">
						<span class="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[10px]">
							Member Since
						</span>
						<span class="text-sm font-medium text-foreground sm:text-base">{memberSince}</span>
					</div>
				</div>
			</Card.Content>
		</div>
	</Card.Root>
</div>

<!-- Invite Modal -->
{#if showInviteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<Card.Root class="w-full max-w-md rounded-2xl border-border bg-card">
			<div class="flex items-center justify-between border-b border-border p-6">
				<h2 class="text-lg font-bold text-foreground">Invite to Community</h2>
				<button
					onclick={() => {
						showInviteModal = false;
						selectedCommunity = null;
					}}
					class="text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Close"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
			<Card.Content class="space-y-4 p-6">
				<p class="text-sm text-muted-foreground">
					Select a community to invite {displayName} to:
				</p>
				<div class="space-y-2 max-h-64 overflow-y-auto">
					{#if myAdminCommunities.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">
							You don't admin any communities yet
						</p>
					{:else}
						{#each myAdminCommunities as community (community.id)}
							<button
								onclick={() => selectedCommunity = community.id}
								class="w-full rounded-lg border-2 p-3 text-left transition-all {selectedCommunity === community.id 
									? 'border-primary bg-primary/10' 
									: 'border-border hover:border-primary/50'}"
							>
								<p class="font-medium text-foreground">{community.name}</p>
								<p class="text-xs text-muted-foreground">{community.member_count} members</p>
							</button>
						{/each}
					{/if}
				</div>
				<div class="flex gap-3 pt-4 border-t border-border">
					<Button
						variant="outline"
						onclick={() => {
							showInviteModal = false;
							selectedCommunity = null;
						}}
						class="flex-1"
					>
						Cancel
					</Button>
					<Button
						onclick={handleInvite}
						disabled={!selectedCommunity || inviteLoading}
						class="flex-1 bg-primary font-bold hover:bg-primary/90"
					>
						{#if inviteLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Sending...
						{:else}
							Send Invite
						{/if}
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #3f3f46;
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}
</style>
