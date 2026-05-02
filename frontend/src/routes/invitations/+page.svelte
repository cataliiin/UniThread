<script lang="ts">
	import InvitationsList from '$lib/components/InvitationsList.svelte';
	import { invitationsState } from '$lib/stores/invitations.svelte';
</script>

<svelte:head>
	<title>Invitations - UniThread</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 py-8">
	<div class="mx-auto max-w-2xl px-4">
		<!-- Header -->
		<header class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<a
					href="/"
					aria-label="Go back"
					class="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</a>
				<h1 class="text-2xl font-bold text-white">Invitations</h1>
			</div>

			<!-- Pending count badge -->
			{#if invitationsState.pendingCount > 0}
				<span
					class="rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-medium text-indigo-400"
				>
					{invitationsState.pendingCount} pending
				</span>
			{/if}
		</header>

	<!-- Invitations List -->
	<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
		<InvitationsList />
	</div>
	</div>
</div>
