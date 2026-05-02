<script lang="ts">
	import CommunityForm from '$lib/components/CommunityForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let community = $derived(data.community);
	let isOwner = $derived(data.isOwner);
</script>

<svelte:head>
	<title>Edit Community{community ? ` - ${community.name}` : ''} - UniThread</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 py-8">
	<div class="mx-auto max-w-2xl px-4">
		<header class="mb-6 flex items-center gap-4">
			<a
				href={community ? `/communities/${community.id}` : '/'}
				aria-label="Go back"
				class="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m15 18-6-6 6-6"/>
				</svg>
			</a>
			<div>
				<h1 class="text-2xl font-bold text-white">Edit Community</h1>
				{#if community}
					<p class="text-sm text-slate-400">{community.name}</p>
				{/if}
			</div>
			{#if isOwner}
				<span class="ml-auto rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400">
					Owner
				</span>
			{/if}
		</header>

		{#if community}
			<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
				<CommunityForm {community} mode="edit" />
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-12">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
				<p class="mt-4 text-slate-400">Loading community...</p>
			</div>
		{/if}
	</div>
</div>
