<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';

	let { data }: { data: PageData } = $props();

	let community = $derived(data.community);
	let isAdmin = $derived(data.isAdmin);
	let isOwner = $derived(data.isOwner);

	// Helper to get image URL (supports localStorage for dev and MinIO for prod)
	function getImageUrl(key: string | null): string | null {
		if (!key) return null;
		if (key.startsWith('local_img_')) {
			return localStorage.getItem(key);
		}
		return `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000/community-assets'}/${key}`;
	}
</script>

<svelte:head>
	<title>{community ? `${community.name} - Community` : 'Community'} - UniThread</title>
</svelte:head>

<div class="min-h-screen bg-slate-950">
	{#if community}
		<!-- Banner -->
		<div class="relative h-48 w-full overflow-hidden">
			{#if community.banner_key}
				<img
					src={getImageUrl(community.banner_key)}
					alt="{community.name} banner"
					class="h-full w-full object-cover"
				/>
			{:else}
				<div class="h-full w-full bg-linear-to-r from-indigo-600 to-purple-600"></div>
			{/if}
		</div>

		<div class="mx-auto max-w-4xl px-4">
			<!-- Community Header -->
			<div class="relative -mt-16 mb-6 flex items-end gap-4">
				<!-- Icon -->
				<div class="h-32 w-32 overflow-hidden rounded-2xl border-4 border-slate-950 bg-slate-800 shadow-xl">
					{#if community.icon_key}
						<img
							src={getImageUrl(community.icon_key)}
							alt="{community.name} icon"
							class="h-full w-full object-cover"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-indigo-600 text-4xl font-bold text-white">
							{community.name.charAt(0).toUpperCase()}
						</div>
					{/if}
				</div>

				<div class="mb-2 flex-1">
					<div class="flex items-center gap-3">
						<h1 class="text-2xl font-bold text-white">{community.name}</h1>
						<span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400 capitalize">
							{community.type}
						</span>
						{#if isOwner}
							<span class="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400">
								Owner
							</span>
						{/if}
					</div>
					<p class="text-slate-400">{community.member_count} members</p>
				</div>

				{#if isAdmin}
					<button
						onclick={() => goto(`/communities/${community.id}/edit`)}
						class="mb-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
					>
						Edit Community
					</button>
				{/if}
			</div>

			<!-- Description -->
			{#if community.description}
				<div class="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
					<p class="text-slate-300">{community.description}</p>
				</div>
			{/if}

			<!-- Settings Info -->
			<div class="mb-6 flex flex-wrap gap-4 text-sm text-slate-400">
				{#if community.allow_anonymous}
					<span class="flex items-center gap-1">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 3a4 4 0 0 0-4 4c0 2.5 2 5 4 8 2-3 4-5.5 4-8a4 4 0 0 0-4-4Z"/><path d="M12 16v5"/><circle cx="12" cy="11" r="1"/>
						</svg>
						Anonymous posts allowed
					</span>
				{/if}
			</div>

			<!-- Posts Feed Placeholder -->
			<div class="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
				<p class="text-slate-400">Posts feed coming soon...</p>
			</div>
		</div>
	{:else}
		<div class="flex h-screen items-center justify-center">
			<div class="text-center">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto"></div>
				<p class="mt-4 text-slate-400">Loading community...</p>
			</div>
		</div>
	{/if}
</div>
