<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';

	let { 
		open = $bindable(false),
		title,
		description,
		onConfirm,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'default'
	}: {
		open: boolean;
		title: string;
		description: string;
		onConfirm: () => void | Promise<void>;
		confirmText?: string;
		cancelText?: string;
		variant?: 'default' | 'destructive' | 'primary';
	} = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		use:portal
		class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
		onclick={() => open = false}
		transition:fade={{ duration: 200 }}
	>
		<div 
			class="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div class="p-6">
				<h2 class="text-xl font-bold text-foreground">{title}</h2>
				<p class="mt-2 text-sm text-muted-foreground leading-relaxed">
					{description}
				</p>
			</div>
			
			<div class="flex items-center justify-end gap-3 bg-muted/30 px-6 py-4 border-t border-border">
				<Button 
					variant="outline" 
					class="rounded-xl border-border bg-transparent hover:bg-muted"
					onclick={() => open = false}
				>
					{cancelText}
				</Button>
				<Button 
					onclick={handleConfirm}
					variant={variant === 'destructive' ? 'destructive' : (variant === 'primary' ? 'default' : 'default')}
					class="rounded-xl font-bold shadow-lg {variant === 'destructive' ? 'shadow-destructive/20' : 'shadow-primary/20'}"
				>
					{confirmText}
				</Button>
			</div>
		</div>
	</div>
{/if}
