<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import { MessagesService, RelationshipsService, UsersService } from '$lib/api/services';
	import { user } from '$lib/stores/user.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import type { components } from '$lib/api/openapi-generated-schema';
	import { MessageSquare } from '@lucide/svelte';

	// Import modular components
	import ChatHeader from '$lib/components/messages/ChatHeader.svelte';
	import MessageBubble from '$lib/components/messages/MessageBubble.svelte';
	import MessageInput from '$lib/components/messages/MessageInput.svelte';

	type MessageResponse = components['schemas']['MessageResponse'];
	type UserProfileResponse = components['schemas']['UserProfileResponse'];

	const otherUserId = $derived($page.params.id || '');

	let messages = $state<MessageResponse[]>([]);
	let targetUser = $state<UserProfileResponse | null>(null);
	let loading = $state(true);
	let sending = $state(false);
	let pollInterval: any;
	let chatContainer: HTMLElement;
	
	// Relationship states
	let isBlocked = $state(false);
	let isMuted = $state(false);

	async function loadTargetUser() {
		try {
			targetUser = await UsersService.getUserProfile(otherUserId);
			// Check if blocked
			const blockedList = await RelationshipsService.listBlockedUsers(1, 100);
			isBlocked = blockedList.items.some(u => u.target_user_id === otherUserId);
		} catch (e) {
			console.error('Failed to load target user:', e);
		}
	}

	async function loadHistory(showLoader = false) {
		if (showLoader) loading = true;
		try {
			const res = await MessagesService.getMessageHistory(otherUserId, 1, 50);
			// We reverse because the API returns newest first, but we want to display chronological
			const newMessages = (res.items || []).reverse();
			
			const hadNewMessages = newMessages.length > messages.length || 
				(newMessages.length > 0 && messages.length > 0 && newMessages[newMessages.length-1].id !== messages[messages.length-1].id);
			
			messages = newMessages;
			
			if (hadNewMessages) {
				scrollToBottom();
			}
		} catch (e) {
			console.error('Failed to load history:', e);
		} finally {
			if (showLoader) loading = false;
		}
	}

	async function handleSendMessage(content: string) {
		if (sending) return;
		sending = true;
		
		try {
			const sent = await MessagesService.createMessage(otherUserId, { content });
			messages = [...messages, sent];
			scrollToBottom();
		} catch (e) {
			toasts.show('Failed to send message', 'error');
		} finally {
			sending = false;
		}
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	// Relationship actions
	async function toggleBlock() {
		try {
			if (isBlocked) {
				await RelationshipsService.unblockUser(otherUserId);
				isBlocked = false;
				toasts.show('User unblocked', 'success');
			} else {
				await RelationshipsService.blockUser(otherUserId);
				isBlocked = true;
				toasts.show('User blocked', 'warning');
			}
		} catch (e) {
			toasts.show('Action failed', 'error');
		}
	}

	async function toggleMute() {
		try {
			if (isMuted) {
				await RelationshipsService.unmuteUser(otherUserId);
				isMuted = false;
				toasts.show('Conversation unmuted', 'success');
			} else {
				await RelationshipsService.muteUser(otherUserId);
				isMuted = true;
				toasts.show('Conversation muted', 'info');
			}
		} catch (e) {
			toasts.show('Action failed', 'error');
		}
	}

	onMount(() => {
		// Poll every 8 seconds for new messages - highly reliable and server-friendly
		pollInterval = setInterval(() => {
			loadHistory(false);
		}, 8000);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	// Re-load when switching between different users
	$effect(() => {
		if (otherUserId) {
			messages = [];
			loading = true;
			loadTargetUser().then(() => {
				loadHistory(true).then(() => {
					scrollToBottom();
				});
			});
		}
	});
</script>

<div class="flex flex-col h-full bg-background relative">
	<!-- Chat Header -->
	<ChatHeader 
		{targetUser} 
		{isBlocked} 
		{isMuted} 
		onToggleBlock={toggleBlock} 
		onToggleMute={toggleMute} 
	/>

	<!-- Messages Scroll Area -->
	<div 
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 bg-gradient-to-b from-background to-card/10"
	>
		{#if messages.length === 0}
			{#if !loading}
				<div class="flex flex-col items-center justify-center h-full opacity-60 text-center px-8">
					<div class="mb-4 rounded-full bg-primary/10 p-4 border border-primary/20 shadow-xl shadow-primary/5">
						<MessageSquare class="h-8 w-8 text-primary" />
					</div>
					<h3 class="text-lg font-bold text-foreground">No messages yet</h3>
					<p class="text-sm text-muted-foreground max-w-xs mt-1">
						Start the conversation by sending a greeting. Your messages are private and university-secured.
					</p>
				</div>
			{/if}
		{:else}
			{#each messages as msg, i (msg.id)}
				{@const isMe = msg.sender_id === user.id}
				{@const prevMsg = i > 0 ? messages[i - 1] : null}
				{@const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()}

				<MessageBubble 
					{msg} 
					{isMe} 
					{showDate} 
					isLast={i === messages.length - 1} 
				/>
			{/each}
		{/if}
	</div>

	<!-- Message Input Bar -->
	<MessageInput 
		{isBlocked} 
		{sending} 
		onSendMessage={handleSendMessage} 
	/>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: hsl(var(--border));
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--primary) / 0.2);
	}
</style>
