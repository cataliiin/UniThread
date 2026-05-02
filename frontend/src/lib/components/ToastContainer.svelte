<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';
	import { CheckCircle2, XCircle, AlertTriangle, Info, X } from '@lucide/svelte';

	// Limit to max 5 visible toasts
	const MAX_TOASTS = 5;
	let visibleToasts = $derived(toasts.messages.slice(-MAX_TOASTS));

	const toastStyles = {
		success: 'border-green-500/30 bg-green-950/80 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]',
		error: 'border-red-500/30 bg-red-950/80 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
		warning: 'border-amber-500/30 bg-amber-950/80 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
		info: 'border-primary/30 bg-primary-950/80 text-primary shadow-[0_0_20px_rgba(50,65,95,0.2)]'
	};

	const iconStyles = {
		success: 'bg-green-500/20 text-green-400',
		error: 'bg-red-500/20 text-red-400',
		warning: 'bg-amber-500/20 text-amber-400',
		info: 'bg-primary/20 text-primary'
	};
</script>

<div
	class="pointer-events-none fixed bottom-20 left-1/2 z-[9999] flex -translate-x-1/2 flex-col gap-3 sm:right-4 sm:bottom-4 sm:left-auto sm:translate-x-0 lg:right-6 lg:bottom-6"
>
	{#each visibleToasts as toast (toast.id)}
		<div
			animate:flip={{ duration: 300 }}
			in:fly={{ x: 300, duration: 400, opacity: 0 }}
			out:fly={{ x: 100, duration: 300, opacity: 0 }}
			class="pointer-events-auto flex max-w-[350px] min-w-[280px] items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 {toastStyles[toast.type]}"
		>
			{#if toast.type === 'success'}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {iconStyles.success}">
					<CheckCircle2 class="h-5 w-5" />
				</div>
			{:else if toast.type === 'error'}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {iconStyles.error}">
					<XCircle class="h-5 w-5" />
				</div>
			{:else if toast.type === 'warning'}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {iconStyles.warning}">
					<AlertTriangle class="h-5 w-5" />
				</div>
			{:else}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {iconStyles.info}">
					<Info class="h-5 w-5" />
				</div>
			{/if}

			<div class="flex-1 text-sm font-semibold">
				{toast.message}
			</div>

			<button
				onclick={() => toasts.remove(toast.id)}
				class="p-1 text-current opacity-50 transition-all duration-200 hover:opacity-100 hover:scale-110"
				aria-label="Dismiss notification"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{/each}
</div>
