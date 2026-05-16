<script lang="ts">
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { StorageService } from '$lib/api/services/StorageService';
	import { Check, CheckCheck } from '@lucide/svelte';
	import type { components } from '$lib/api/openapi-generated-schema';

	type MessageResponse = components['schemas']['MessageResponse'];

	let { 
		msg, 
		isMe, 
		showDate, 
		isLast 
	}: {
		msg: MessageResponse;
		isMe: boolean;
		showDate: boolean;
		isLast: boolean;
	} = $props();

	function resolveAvatar(avatarKey: string | null) {
		if (!avatarKey) return null;
		return StorageService.getPublicUrl('user-assets', avatarKey);
	}

	function getInitials(u: any) {
		if (!u) return '';
		if (u.first_name && u.last_name) {
			return (u.first_name[0] + u.last_name[0]).toUpperCase();
		}
		return u.username.substring(0, 2).toUpperCase();
	}

	function formatMessageTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatSeparatorDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		if (date.toDateString() === now.toDateString()) return 'Today';
		const yesterday = new Date(now);
		yesterday.setDate(now.getDate() - 1);
		if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
		return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
	}
</script>

{#if showDate}
	<div class="flex justify-center my-8">
		<span class="rounded-full bg-secondary/50 border border-border/40 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm animate-fade-in">
			{formatSeparatorDate(msg.created_at)}
		</span>
	</div>
{/if}

<div class="flex {isMe ? 'justify-end' : 'justify-start'} group items-end gap-2 px-1">
	{#if !isMe}
		<a href="/profile/{msg.sender.id}" class="mb-1 shrink-0">
			<UserAvatar 
				src={resolveAvatar(msg.sender.avatar_key)} 
				initials={getInitials(msg.sender)} 
				size="xs" 
				className="h-7 w-7"
			/>
		</a>
	{/if}
	
	<div class="flex flex-col max-w-[85%] sm:max-w-[70%] {isMe ? 'items-end' : 'items-start'}">
		<div 
			class="relative rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all duration-300
			{isMe 
				? 'bg-primary text-primary-foreground rounded-br-none shadow-primary/20' 
				: 'bg-card border border-border/60 text-foreground rounded-bl-none shadow-black/5 hover:border-primary/30'}"
		>
			<p class="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
			
			<!-- Time on hover for clean look -->
			<div class="absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] text-muted-foreground font-medium {isMe ? 'right-0' : 'left-0'}">
				{formatMessageTime(msg.created_at)}
			</div>
		</div>
		
		{#if isMe && isLast}
			<div class="flex items-center gap-1 mt-1 mr-1">
				{#if msg.is_read}
					<CheckCheck class="h-3 w-3 text-primary" />
				{:else}
					<Check class="h-3 w-3 text-muted-foreground/50" />
				{/if}
			</div>
		{/if}
	</div>
</div>
