<script lang="ts">
	import type { CampusBuilding } from '$lib/map-data/campusBuildings';
	import { themeState } from '$lib/stores/theme.svelte';

	let { building, isActive, distance, onclick } = $props<{
		building: CampusBuilding;
		isActive: boolean;
		distance: number | null;
		onclick: () => void;
	}>();

	const colors = $derived.by(() => {
		const theme = themeState.current;
		const c: Record<string, string> = {
			academic: '#32415f',
			administrative: '#6b21a8',
			library: '#b45309',
			campus: '#047857'
		};

		if (theme === 'outpost') {
			c.academic = '#3f3f46';
			c.administrative = '#ff0000';
			c.campus = '#18181b';
		} else if (theme === 'amethyst' || theme === 'cyberpop') {
			c.academic = '#c084fc';
			c.administrative = '#ff007f';
		} else if (theme === 'coffee') {
			c.academic = '#c68642';
			c.administrative = '#4a3429';
		} else if (theme === 'sakura') {
			c.academic = '#ffb7c5';
			c.administrative = '#dcae96';
		} else if (theme === 'nordic') {
			c.academic = '#5e81ac';
			c.administrative = '#bf616a';
		}

		return c;
	});
</script>

<button
	class="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-all duration-200 hover:bg-secondary/50 hover:border-sidebar-border
	{isActive ? 'bg-primary/10 border-primary/30' : ''}"
	{onclick}
>
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold tracking-tighter text-white transition-colors duration-300"
		style="background: {colors[building.category]}"
	>
		{building.shortName}
	</div>
	<div class="flex min-w-0 flex-1 flex-col gap-0.5">
		<span class="truncate text-sm font-semibold text-foreground">
			{building.name}
		</span>
		<span class="truncate text-xs text-muted-foreground">
			{building.address}
		</span>
		{#if distance !== null}
			<span class="text-[11px] font-medium text-blue-400">
				~{distance.toFixed(2)} km away
			</span>
		{/if}
	</div>
	<svg
		class="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<polyline points="9 18 15 12 9 6"></polyline>
	</svg>
</button>
