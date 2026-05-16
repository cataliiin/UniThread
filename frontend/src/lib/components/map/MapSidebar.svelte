<script lang="ts">
	import {
		campusBuildings,
		haversineDistance,
		type CampusBuilding
	} from '$lib/map-data/campusBuildings';
	import MapBuildingCard from './MapBuildingCard.svelte';
	import MapControls from './MapControls.svelte';

	let {
		sidebarOpen = $bindable(true),
		selectedBuilding = $bindable(null),
		userLocation,
		locationError,
		onlocate,
		onreset,
		onflyto
	} = $props<{
		sidebarOpen: boolean;
		selectedBuilding: CampusBuilding | null;
		userLocation: { lat: number; lng: number } | null;
		locationError: string;
		onlocate: () => void;
		onreset: () => void;
		onflyto: (b: CampusBuilding) => void;
	}>();

	let searchQuery = $state('');

	let filteredBuildings = $derived(
		campusBuildings.filter(
			(b) =>
				b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.faculties.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);
</script>

<aside
	class="relative z-10 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden transition-all duration-300
	{sidebarOpen ? 'w-[360px]' : 'w-0'}
	{sidebarOpen ? 'lg:static' : 'lg:static'}
	max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:shadow-2xl max-lg:z-20
	{!sidebarOpen && 'max-lg:-translate-x-full'}"
>
	<!-- Sidebar Header -->
	<div class="flex min-h-[56px] items-center justify-between border-b border-sidebar-border p-4">
		{#if sidebarOpen}
			<h2 class="text-sm font-bold tracking-tight text-foreground">UNITBV Buildings</h2>
		{/if}
		<button
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
			onclick={() => (sidebarOpen = !sidebarOpen)}
			title="Toggle sidebar"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				{#if sidebarOpen}
					<polyline points="15 18 9 12 15 6"></polyline>
				{:else}
					<polyline points="9 18 15 12 9 6"></polyline>
				{/if}
			</svg>
		</button>
	</div>

	{#if sidebarOpen}
		<div class="flex flex-1 flex-col gap-4 overflow-hidden p-3">
			<!-- Search Box -->
			<div
				class="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent px-3 py-2.5 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
			>
				<svg
					class="shrink-0 text-muted-foreground"
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" x2="16.65" y1="21" y2="16.65"></line>
				</svg>
				<input
					class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
					type="text"
					placeholder="Search building, faculty..."
					bind:value={searchQuery}
				/>
			</div>

			<!-- Map Controls -->
			<MapControls {onlocate} {onreset} />

			{#if locationError}
				<div class="rounded-lg bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
					{locationError}
				</div>
			{/if}

			<!-- Buildings List -->
			<div class="flex flex-1 flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
				{#each filteredBuildings as building (building.id)}
					<MapBuildingCard
						{building}
						isActive={selectedBuilding?.id === building.id}
						distance={userLocation
							? haversineDistance(userLocation.lat, userLocation.lng, building.lat, building.lng)
							: null}
						onclick={() => onflyto(building)}
					/>
				{:else}
					<div class="py-6 text-center text-sm text-muted-foreground">
						No results for "{searchQuery}"
					</div>
				{/each}
			</div>
		</div>
	{/if}
</aside>

<style>
	/* Custom scrollbar utility if needed, but Tailwind classes usually handle it */
	.scrollbar-thin::-webkit-scrollbar {
		width: 4px;
	}
	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: #27272a;
		border-radius: 2px;
	}
</style>
