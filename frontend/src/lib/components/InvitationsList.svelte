<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import InvitationCard from './InvitationCard.svelte';
	import { invitationsState } from '$lib/stores/invitations.svelte';

	onMount(() => {
		invitationsState.fetchInvitations();
	});
</script>

{#if invitationsState.loading && invitationsState.invitations.length === 0}
	<div class="flex items-center justify-center py-12">
		<div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
	</div>
{:else if invitationsState.invitations.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-center" in:fade>
		<div class="mb-4 rounded-full bg-secondary p-4 transition-all duration-300 hover:bg-secondary/80">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-muted-foreground"
			>
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				<circle cx="9" cy="10" r="1" fill="currentColor" />
				<circle cx="15" cy="10" r="1" fill="currentColor" />
			</svg>
		</div>
		<h3 class="text-lg font-medium text-foreground">No pending invitations</h3>
		<p class="mt-1 max-w-sm text-muted-foreground">
			You don't have any community invitations right now. Check back later or explore communities to join!
		</p>
		<a
			href="/search"
			class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40"
		>
			Explore Communities
		</a>
	</div>
{:else}
	<div class="space-y-4">
		{#each invitationsState.invitations as invitation (invitation.id)}
			<InvitationCard {invitation} />
		{/each}
	</div>
{/if}
