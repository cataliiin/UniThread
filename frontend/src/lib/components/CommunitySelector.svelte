<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { Check, ChevronDown, Search } from 'lucide-svelte';
	import { StorageService } from '$lib/api/services';

	let { communities = [], selectedId = $bindable() } = $props<{
		communities: any[];
		selectedId: string;
	}>();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let containerEl = $state<HTMLElement | null>(null);

	let selectedCommunity = $derived(communities.find(c => c.id === selectedId));
	let filteredCommunities = $derived(
		communities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function handleSelect(id: string) {
		selectedId = id;
		isOpen = false;
		searchQuery = '';
	}

	function handleGlobalClick(event: MouseEvent) {
		if (isOpen && containerEl && !containerEl.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	function getCommunityIcon(community: any): string | null {
		if (!community || !community.icon_key) return null;
		if (community.icon_key.startsWith('local_img_')) return localStorage.getItem(community.icon_key);
		return StorageService.getPublicUrl('community-assets', community.icon_key);
	}
</script>

<svelte:window onclick={handleGlobalClick} />

<div bind:this={containerEl} class="relative w-full">
	<button
		type="button"
		onclick={() => isOpen = !isOpen}
		class="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/15 px-3 py-2.5 text-left text-sm font-semibold transition-all hover:bg-secondary/25 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 shadow-sm"
	>
		<!-- Avatar / Initials of Selected Community -->
		{#if selectedCommunity}
			{@const iconUrl = getCommunityIcon(selectedCommunity)}
			{#if iconUrl}
				<img src={iconUrl} alt="" class="h-8 w-8 shrink-0 rounded-lg object-cover shadow-sm border border-border/20" />
			{:else}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary transition-all duration-300">
					{selectedCommunity.name.charAt(0).toUpperCase()}
				</div>
			{/if}
			<div class="flex-1 truncate">
				<p class="text-sm font-bold text-foreground leading-tight">{selectedCommunity.name}</p>
				<p class="text-[10px] text-muted-foreground/70 font-normal leading-none mt-0.5">Approved Member</p>
			</div>
		{:else}
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
				?
			</div>
			<span class="flex-1 text-muted-foreground font-medium">Select a community</span>
		{/if}
		
		<ChevronDown class="h-4 w-4 text-muted-foreground/70 transition-transform duration-250 {isOpen ? 'rotate-180' : ''}" />
	</button>

	<!-- Dropover Card Menu -->
	{#if isOpen}
		<div
			in:fly={{ y: 8, duration: 200 }}
			out:fade={{ duration: 150 }}
			class="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-border bg-card p-2 shadow-xl backdrop-blur-xl max-w-full"
		>
			<!-- Dynamic Search Bar (shown only when user is in > 5 communities) -->
			{#if communities.length > 5}
				<div class="relative mb-2 px-1">
					<Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
					<input
						type="text"
						placeholder="Search your communities..."
						bind:value={searchQuery}
						class="h-9 w-full rounded-xl border border-border/60 bg-secondary/15 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all"
					/>
				</div>
			{/if}

			<!-- Scrollable list of communities -->
			<div class="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
				{#if filteredCommunities.length === 0}
					<p class="py-6 text-center text-xs text-muted-foreground">No communities found.</p>
				{:else}
				{#each filteredCommunities as community (community.id)}
					{@const isSelected = community.id === selectedId}
					{@const iconUrl = getCommunityIcon(community)}
					<button
						type="button"
						onclick={() => handleSelect(community.id)}
						class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 {isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/15 text-foreground'}"
					>
						<!-- Community Icon / Initials Badge -->
						{#if iconUrl}
							<img src={iconUrl} alt="" class="h-8 w-8 shrink-0 rounded-lg object-cover border border-border/10" />
						{:else}
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold {isSelected ? 'text-primary' : 'text-primary/70'}">
								{community.name.charAt(0).toUpperCase()}
							</div>
						{/if}
							
							<!-- Community Names and description -->
							<div class="flex-1 min-w-0">
								<p class="truncate text-sm font-bold leading-tight">{community.name}</p>
								{#if community.description}
									<p class="truncate text-[10px] text-muted-foreground/70 font-normal mt-0.5">{community.description}</p>
								{:else}
									<p class="truncate text-[10px] text-muted-foreground/50 font-normal mt-0.5">Active community</p>
								{/if}
							</div>

							<!-- Selected Check Indicator -->
							{#if isSelected}
								<Check class="h-4 w-4 shrink-0 text-primary" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Subtle premium custom scrollbar styling */
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: hsl(var(--border) / 0.6);
		border-radius: 99px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--border));
	}
</style>
