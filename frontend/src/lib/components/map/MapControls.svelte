<script lang="ts">
	let { onlocate, onreset } = $props<{
		onlocate: () => void;
		onreset: () => void;
	}>();
</script>

<div class="flex gap-2">
	<button
		class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
		onclick={onlocate}
	>
		<svg
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
			<circle cx="12" cy="12" r="3"></circle>
			<path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path>
		</svg>
		My Location
	</button>
	<button
		class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
		onclick={onreset}
	>
		<svg
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
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
			<path d="M3 3v5h5"></path>
		</svg>
		Reset
	</button>
</div>
