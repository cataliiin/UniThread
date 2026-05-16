<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { MessagesService, SearchService } from '$lib/api/services';
	import { user } from '$lib/stores/user.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { StorageService } from '$lib/api/services/StorageService';
	import type { components } from '$lib/api/openapi-generated-schema';
	import { MessageSquare, Search, Sparkles, Loader2 } from '@lucide/svelte';

	// Import modular components
	import ConversationItem from '$lib/components/messages/ConversationItem.svelte';

	type MessageResponse = components['schemas']['MessageResponse'];
	type UserProfileResponse = components['schemas']['UserProfileResponse'];

	let { children } = $props();

	let conversations = $state<MessageResponse[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<UserProfileResponse[]>([]);
	let searchLoading = $state(false);
	let loading = $state(true);
	let pollInterval: any;

	// Helper to resolve user details from a conversation
	function getOtherUser(convo: MessageResponse) {
		return convo.sender_id === user.id ? convo.recipient : convo.sender;
	}

	// Fetch conversations list
	async function loadConversations(showLoader = false) {
		if (showLoader) loading = true;
		try {
			const res = await MessagesService.listRecentConversations();
			conversations = res || [];
		} catch (e) {
			console.error('Failed to load conversations:', e);
		} finally {
			if (showLoader) loading = false;
		}
	}

	// Handle search for starting new conversations
	let searchTimeout: any;
	function handleSearchInput() {
		if (searchTimeout) clearTimeout(searchTimeout);
		
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}

		searchTimeout = setTimeout(async () => {
			searchLoading = true;
			try {
				const results = await SearchService.globalSearch(searchQuery, 'users', 8);
				searchResults = results.users.filter(u => u.id !== user.id);
			} catch (e) {
				console.error('Search failed:', e);
			} finally {
				searchLoading = false;
			}
		}, 300);
	}

	function resolveAvatar(avatarKey: string | null) {
		if (!avatarKey) return null;
		return StorageService.getPublicUrl('user-assets', avatarKey);
	}

	function getInitials(u: any) {
		if (u.first_name && u.last_name) {
			return (u.first_name[0] + u.last_name[0]).toUpperCase();
		}
		return u.username.substring(0, 2).toUpperCase();
	}

	onMount(() => {
		loadConversations(true);
		
		// Poll every 15 seconds for conversations list updates - highly reliable and server-friendly
		pollInterval = setInterval(() => {
			loadConversations(false);
		}, 15000);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});

	// React to navigation changes (e.g. if we start/finish a chat)
	$effect(() => {
		if ($page.url.pathname) {
			loadConversations(false);
		}
	});

	// Filter active conversations by search query locally if not searching global users
	let filteredConversations = $derived.by(() => {
		if (!searchQuery.trim()) return conversations;
		return conversations.filter(convo => {
			const other = getOtherUser(convo);
			const fullName = `${other.first_name || ''} ${other.last_name || ''}`.toLowerCase();
			return other.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
				fullName.includes(searchQuery.toLowerCase());
		});
	});

	let isInsideChat = $derived($page.params.id !== undefined);
</script>

<div class="flex fixed top-16 bottom-20 left-0 right-0 lg:static lg:h-screen w-full overflow-hidden bg-background">
	<!-- Left Panel: Conversations list -->
	<aside class="flex h-full w-full flex-col border-r border-border bg-card/40 backdrop-blur-md transition-all duration-300 lg:w-96 {isInsideChat ? 'hidden lg:flex' : 'flex'}">
		<!-- Header -->
		<div class="p-6 border-b border-border/60">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
					<MessageSquare class="h-6 w-6 text-primary animate-pulse" />
					Messages
				</h1>
				<span class="inline-flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
					{conversations.filter(c => !c.is_read && c.recipient_id === user.id).length} unread
				</span>
			</div>

			<!-- Search / Filter Bar -->
			<div class="relative">
				<Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					bind:value={searchQuery}
					oninput={handleSearchInput}
					placeholder="Search conversations or users..."
					class="w-full rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
				/>
			</div>
		</div>

		<!-- Conversations scroll area -->
		<div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
			{#if searchLoading}
				<div class="flex items-center justify-center py-8">
					<Loader2 class="h-6 w-6 animate-spin text-primary" />
				</div>
			{:else if searchQuery.trim() && searchResults.length > 0}
				<!-- Global Search Results for new chats -->
				<div class="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
					<Sparkles class="h-3.5 w-3.5 text-primary" />
					Start a new chat
				</div>
				{#each searchResults as profile (profile.id)}
					<button
						onclick={() => {
							searchQuery = '';
							searchResults = [];
							goto(`/messages/${profile.id}`);
						}}
						class="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-300 hover:bg-secondary/40 border border-transparent hover:border-border/40 group"
					>
						<UserAvatar
							src={resolveAvatar(profile.avatar_key)}
							initials={getInitials(profile)}
							size="sm"
							className="group-hover:scale-105 transition-transform"
						/>
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-foreground group-hover:text-primary transition-colors">
								{profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : `@${profile.username}`}
							</div>
							<div class="text-xs text-muted-foreground truncate">@{profile.username}</div>
						</div>
					</button>
				{/each}
				<hr class="border-border/50 my-2" />
			{/if}

			{#if loading && conversations.length === 0}
				<!-- Skeleton Loader -->
				{#each Array(4) as _}
					<div class="flex items-center gap-3 rounded-2xl p-3 border border-transparent animate-pulse">
						<div class="h-10 w-10 rounded-full bg-muted"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 w-24 rounded bg-muted"></div>
							<div class="h-3 w-32 rounded bg-muted"></div>
						</div>
					</div>
				{/each}
			{:else if filteredConversations.length === 0}
				<div class="flex flex-col items-center justify-center text-center py-12 px-4">
					<p class="text-sm text-muted-foreground">No conversations found</p>
					{#if searchQuery}
						<button 
							onclick={() => { searchQuery = ''; searchResults = []; }}
							class="mt-2 text-xs font-semibold text-primary hover:underline"
						>
							Clear search filter
						</button>
					{/if}
				</div>
			{:else}
				<!-- Recent Chats -->
				{#each filteredConversations as convo (convo.id)}
					{@const other = getOtherUser(convo)}
					{@const isActive = $page.params.id === other.id}
					{@const isUnread = !convo.is_read && convo.recipient_id === user.id}
					<ConversationItem 
						{convo} 
						{isActive} 
						{isUnread} 
						onClick={() => goto(`/messages/${other.id}`)} 
					/>
				{/each}
			{/if}
		</div>
	</aside>

	<!-- Right Panel: Conversation panel / children -->
	<main class="flex-1 h-full overflow-hidden relative flex flex-col {!isInsideChat ? 'hidden lg:flex' : 'flex'}">
		{@render children()}
	</main>
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
