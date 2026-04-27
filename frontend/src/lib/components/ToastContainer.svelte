<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';
	import { flip } from 'svelte/animate';
	import { fly, fade } from 'svelte/transition';
</script>

<div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
	{#each toasts.messages as toast (toast.id)}
		<div
			animate:flip={{ duration: 300 }}
			in:fly={{ x: 50, duration: 400 }}
			out:fade={{ duration: 200 }}
			class="pointer-events-auto min-w-[280px] p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3
			{toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : ''}
			{toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : ''}
			{toast.type === 'info' ? 'bg-indigo-50/90 border-indigo-200 text-indigo-800' : ''}"
		>
			{#if toast.type === 'success'}
				<div class="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
				</div>
			{:else if toast.type === 'error'}
				<div class="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
				</div>
			{:else}
				<div class="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
				</div>
			{/if}
			
			<div class="flex-1 font-semibold text-sm">
				{toast.message}
			</div>

			<button 
				onclick={() => toasts.remove(toast.id)}
				class="text-current opacity-40 hover:opacity-100 transition-opacity p-1"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
			</button>
		</div>
	{/each}
</div>
