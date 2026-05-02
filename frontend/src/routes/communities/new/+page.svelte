<script lang="ts">
	import CommunityForm from '$lib/components/CommunityForm.svelte';
</script>

<svelte:head>
	<title>Create Community - UniThread</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 py-8">
	<div class="mx-auto max-w-2xl px-4">
		<header class="mb-6 flex items-center gap-4">
			<a
				href="/"
				aria-label="Go back"
				class="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m15 18-6-6 6-6"/>
				</svg>
			</a>
			<h1 class="text-2xl font-bold text-white">Create Community</h1>
		</header>

		<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
			<p class="mb-6 text-sm text-slate-400">
				Create a new community for your university. You'll automatically become the owner and admin.
			</p>

			<CommunityForm mode="create" />
		</div>
	</div>
</div>
