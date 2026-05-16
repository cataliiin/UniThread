<script lang="ts">
	import { Send, Loader2 } from '@lucide/svelte';

	let { 
		isBlocked, 
		sending, 
		onSendMessage 
	}: {
		isBlocked: boolean;
		sending: boolean;
		onSendMessage: (message: string) => void;
	} = $props();

	let newMessage = $state('');
	const MAX_LENGTH = 1000;

	function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		if (!newMessage.trim() || sending || isBlocked || newMessage.length > MAX_LENGTH) return;
		
		onSendMessage(newMessage);
		newMessage = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<footer class="p-4 sm:p-6 border-t border-border/60 bg-card/40 backdrop-blur-md shrink-0">
	<form 
		onsubmit={handleSubmit}
		class="relative flex items-center gap-3"
	>
		<div class="flex-1 relative group">
			<textarea
				bind:value={newMessage}
				onkeydown={handleKeyDown}
				maxlength={MAX_LENGTH}
				placeholder={isBlocked ? "Cannot send messages to a blocked user" : "Type a message..."}
				disabled={isBlocked}
				rows="1"
				class="w-full max-h-32 resize-none rounded-2xl border border-border bg-background py-3.5 pl-4 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/5 disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar"
			></textarea>

			{#if newMessage.length >= 800}
				<span 
					class="absolute right-12 bottom-1.5 text-[9px] font-extrabold select-none bg-background/90 px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-border/40 transition-all duration-300
					{newMessage.length >= MAX_LENGTH ? 'text-destructive border-destructive/30 animate-pulse' : 'text-muted-foreground/60'}"
				>
					{newMessage.length} / {MAX_LENGTH}
				</span>
			{/if}
			
			<button
				type="submit"
				disabled={!newMessage.trim() || sending || isBlocked || newMessage.length > MAX_LENGTH}
				class="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
			>
				{#if sending}
					<Loader2 class="h-4 w-4 animate-spin" />
				{:else}
					<Send class="h-4 w-4" />
				{/if}
			</button>
		</div>
	</form>
</footer>
