<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';

	// Limit to max 5 visible toasts
	const MAX_TOASTS = 5;
	let visibleToasts = $derived(toasts.messages.slice(-MAX_TOASTS));
</script>

<div class="pointer-events-none fixed bottom-20 left-1/2 z-9999 flex -translate-x-1/2 flex-col gap-3 sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0 lg:bottom-6 lg:right-6">
	{#each visibleToasts as toast (toast.id)}
		<div
			animate:flip={{ duration: 300 }}
			in:fly={{ x: 300, duration: 400, opacity: 0 }}
			out:fly={{ x: 100, duration: 300, opacity: 0 }}
			class="pointer-events-auto flex min-w-70 max-w-87.5 items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl
			{toast.type === 'success' ? 'border-green-200 bg-green-50/90 text-green-800' : ''}
			{toast.type === 'error' ? 'border-red-200 bg-red-50/90 text-red-800' : ''}
			{toast.type === 'warning' ? 'border-amber-200 bg-amber-50/90 text-amber-800' : ''}
			{toast.type === 'info' ? 'border-indigo-200 bg-indigo-50/90 text-indigo-800' : ''}"
		>
			{#if toast.type === 'success'}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
					>
				</div>
			{:else if toast.type === 'error'}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line
							x1="12"
							x2="12.01"
							y1="16"
							y2="16"
						/></svg
					>
				</div>
			{:else if toast.type === 'warning'}
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg
					>
				</div>
			{:else}
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="16" y2="12" /><line
							x1="12"
							x2="12.01"
							y1="8"
							y2="8"
						/></svg
					>
				</div>
			{/if}

			<div class="flex-1 text-sm font-semibold">
				{toast.message}
			</div>

			<button
				onclick={() => toasts.remove(toast.id)}
				class="p-1 text-current opacity-40 transition-opacity hover:opacity-100"
				aria-label="Dismiss notification"
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
					><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg
				>
			</button>
		</div>
	{/each}
</div>
