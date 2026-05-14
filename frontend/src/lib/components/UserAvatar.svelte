<script lang="ts">
	import type { Snippet } from 'svelte';

	const sizeClasses = {
		xs: 'h-6 w-6 text-[10px]',
		sm: 'h-9 w-9 text-sm',
		md: 'h-11 w-11 text-base',
		lg: 'h-20 w-20 text-2xl sm:h-[100px] sm:w-[100px] sm:text-3xl',
		xl: 'h-32 w-32 text-4xl'
	} as const;

	type AvatarSize = keyof typeof sizeClasses;

	let {
		src = null,
		initials = '',
		size = 'md',
		className = '',
		children
	} = $props<{
		src?: string | null;
		initials?: string;
		size?: AvatarSize;
		className?: string;
		children?: Snippet;
	}>();

	const selectedSizeClass = $derived(sizeClasses[size as AvatarSize]);
</script>

<div
	class="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-muted-foreground shadow-sm {selectedSizeClass} {className}"
>
	<!-- Holographic Ring (Cyberpunk only) -->
	<div class="hologram absolute inset-0 rounded-full border-2 border-primary/50 opacity-0 transition-opacity duration-300"></div>
	
	{#if src}
		<img
			{src}
			alt="User avatar"
			class="h-full w-full [transform:translateZ(0)] object-cover [backface-visibility:hidden]"
		/>
	{:else}
		<span class="font-bold tracking-tight uppercase">{initials}</span>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	:global(.cyberpunk) .hologram {
		opacity: 1;
		animation: holo-pulse 2s infinite ease-in-out;
		box-shadow: 0 0 15px var(--primary);
	}

	@keyframes holo-pulse {
		0%, 100% { transform: scale(1); opacity: 0.5; }
		50% { transform: scale(1.1); opacity: 0.8; }
	}
</style>
