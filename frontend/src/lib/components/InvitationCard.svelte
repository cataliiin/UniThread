<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Invitation } from '$lib/types/invitation';
	import { invitationsState } from '$lib/stores/invitations.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Check, X, Loader2 } from '@lucide/svelte';

	interface Props {
		invitation: Invitation;
	}

	let { invitation }: Props = $props();

	let isProcessing = $state(false);
	let isDeclining = $state(false);

	function getRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffMinutes = Math.floor(diffMs / (1000 * 60));

		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays === 1) return 'Yesterday';
		return `${diffDays} days ago`;
	}

	async function handleAccept() {
		if (isProcessing) return;
		isProcessing = true;
		await invitationsState.acceptInvitation(invitation.id);
		isProcessing = false;
	}

	async function handleDecline() {
		if (isDeclining) return;
		isDeclining = true;
		await invitationsState.declineInvitation(invitation.id);
		isDeclining = false;
	}

	const communityInitial = $derived(invitation.community_name?.charAt(0).toUpperCase() || '?');
	const inviterInitials = $derived(
		invitation.inviter_name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase() || '??'
	);
</script>

<div out:slide={{ duration: 200 }}>
<Card.Root
	class="group relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(50,65,95,0.15)]"
>
	<!-- Glow Effect -->
	<div class="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

	<Card.Content class="relative flex items-center gap-4 p-4">
		<!-- Community Icon -->
		<div class="shrink-0">
			{#if invitation.community_icon}
				<img
					src={invitation.community_icon}
					alt={invitation.community_name}
					class="h-14 w-14 rounded-xl object-cover ring-2 ring-border transition-all duration-300 group-hover:ring-primary/30"
				/>
			{:else}
				<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-primary/40">
					{communityInitial}
				</div>
			{/if}
		</div>

		<!-- Content -->
		<div class="min-w-0 flex-1">
			<h3 class="truncate font-semibold text-foreground">
				{invitation.community_name || 'Unknown Community'}
			</h3>
			{#if invitation.community_description}
				<p class="truncate text-sm text-muted-foreground">{invitation.community_description}</p>
			{/if}
			<div class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
				<span>Invited by</span>
				{#if invitation.inviter_avatar}
					<img
						src={invitation.inviter_avatar}
						alt={invitation.inviter_name}
						class="h-5 w-5 rounded-full object-cover ring-1 ring-border"
					/>
				{:else}
					<div class="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-secondary-foreground">
						{inviterInitials}
					</div>
				{/if}
				<span class="font-medium text-foreground/80">{invitation.inviter_name || 'Unknown'}</span>
				<span class="text-border">•</span>
				<span>{getRelativeTime(invitation.created_at)}</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex shrink-0 items-center gap-2">
			<Button
				variant="ghost"
				size="sm"
				onclick={handleDecline}
				disabled={isProcessing || isDeclining}
				class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
			>
				{#if isDeclining}
					<Loader2 class="mr-1 h-4 w-4 animate-spin" />
					Declining...
				{:else}
					<X class="mr-1 h-4 w-4" />
					Decline
				{/if}
			</Button>
			<Button
				variant="default"
				size="sm"
				onclick={handleAccept}
				disabled={isProcessing || isDeclining}
				class="bg-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40"
			>
				{#if isProcessing}
					<Loader2 class="mr-1 h-4 w-4 animate-spin" />
					Joining...
				{:else}
					<Check class="mr-1 h-4 w-4" />
					Accept
				{/if}
			</Button>
		</div>
	</Card.Content>
</Card.Root>
</div>
