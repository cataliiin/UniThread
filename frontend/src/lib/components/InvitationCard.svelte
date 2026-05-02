<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import type { Invitation } from '$lib/types/invitation';
	import { invitationsState } from '$lib/stores/invitations.svelte';

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

<div
	class="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700"
	out:slide={{ duration: 200 }}
>
	<!-- Community Icon -->
	<div class="shrink-0">
		{#if invitation.community_icon}
			<img
				src={invitation.community_icon}
				alt={invitation.community_name}
				class="h-14 w-14 rounded-xl object-cover"
			/>
		{:else}
			<div
				class="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white"
			>
				{communityInitial}
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="min-w-0 flex-1">
		<h3 class="truncate font-semibold text-white">
			{invitation.community_name || 'Unknown Community'}
		</h3>
		{#if invitation.community_description}
			<p class="truncate text-sm text-slate-400">{invitation.community_description}</p>
		{/if}
		<div class="mt-1 flex items-center gap-2 text-xs text-slate-500">
			<span>Invited by</span>
			{#if invitation.inviter_avatar}
				<img
					src={invitation.inviter_avatar}
					alt={invitation.inviter_name}
					class="h-5 w-5 rounded-full object-cover"
				/>
			{:else}
				<div class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-medium text-white">
					{inviterInitials}
				</div>
			{/if}
			<span class="font-medium text-slate-400">{invitation.inviter_name || 'Unknown'}</span>
			<span>•</span>
			<span>{getRelativeTime(invitation.created_at)}</span>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex shrink-0 items-center gap-2">
		<button
			onclick={handleDecline}
			disabled={isProcessing || isDeclining}
			class="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
		>
			{#if isDeclining}
				<span class="flex items-center gap-1">
					<div class="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"></div>
					Declining...
				</span>
			{:else}
				Decline
			{/if}
		</button>
		<button
			onclick={handleAccept}
			disabled={isProcessing || isDeclining}
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
		>
			{#if isProcessing}
				<span class="flex items-center gap-1">
					<div class="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
					Joining...
				</span>
			{:else}
				Accept
			{/if}
		</button>
	</div>
</div>
