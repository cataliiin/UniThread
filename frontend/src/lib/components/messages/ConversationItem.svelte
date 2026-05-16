<script lang="ts">
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { StorageService } from '$lib/api/services/StorageService';
	import { user } from '$lib/stores/user.svelte';
	import type { components } from '$lib/api/openapi-generated-schema';

	type MessageResponse = components['schemas']['MessageResponse'];

	let { 
		convo, 
		isActive, 
		isUnread, 
		onClick 
	}: {
		convo: MessageResponse;
		isActive: boolean;
		isUnread: boolean;
		onClick: () => void;
	} = $props();

	// Helper to resolve user details from a conversation
	let other = $derived(convo.sender_id === user.id ? convo.recipient : convo.sender);

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

	function formatTime(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffDays === 0) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays === 1) {
			return 'Yesterday';
		} else if (diffDays < 7) {
			return date.toLocaleDateString([], { weekday: 'short' });
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
	}
</script>

<button
	onclick={onClick}
	class="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-300 border
	{isActive 
		? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.05)]' 
		: 'border-transparent hover:bg-secondary/40 hover:border-border/40 text-foreground'}"
>
	<div class="relative shrink-0">
		<UserAvatar
			src={resolveAvatar(other.avatar_key)}
			initials={getInitials(other)}
			size="sm"
			className="{isActive ? 'ring-2 ring-primary/45' : ''}"
		/>
		{#if isUnread}
			<span class="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-card shadow-sm animate-pulse"></span>
		{/if}
	</div>
	
	<div class="flex-1 min-w-0">
		<div class="flex items-baseline justify-between mb-0.5">
			<span class="font-semibold truncate {isUnread ? 'text-foreground font-bold' : ''}">
				{other.first_name && other.last_name ? `${other.first_name} ${other.last_name}` : `@${other.username}`}
			</span>
			<span class="text-[10px] text-muted-foreground/80 shrink-0 ml-1">
				{formatTime(convo.created_at)}
			</span>
		</div>
		<div class="flex items-center justify-between gap-1 text-xs {isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}">
			<p class="truncate flex-1">
				{convo.sender_id === user.id ? 'You: ' : ''}{convo.content}
			</p>
		</div>
	</div>
</button>
