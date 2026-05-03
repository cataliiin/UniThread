<script lang="ts">
	import { notifications } from '$lib/stores/notification.svelte';
	import NotificationItem from './NotificationItem.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Bell, Check, Trash2 } from 'lucide-svelte';
	import { NotificationType } from '$lib/types/notification';

	let isOpen = $state(false);

	$inspect(notifications.notifications);

	function addMockData() {
		notifications.add({
			id: Date.now().toString(),
			type: NotificationType.Invitation,
			sender_id: '1',
			sender_name: 'John Doe',
			receiver_id: 'me',
			community_id: '1',
			community_name: 'Community 1',
			community_icon: null,
			message: 'Join my community!',
			read: false,
			created_at: new Date()
		});
	}
</script>

<div class="relative inline-block text-left">
	<Button variant="ghost" size="icon" class="relative" onclick={() => (isOpen = !isOpen)}>
		<Bell class="h-5 w-5" />
		{#if notifications.unreadCount > 0}
			<span
				class="text-destructive-foreground absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold"
			>
				{notifications.unreadCount}
			</span>
		{/if}
	</Button>
	{#if isOpen}
		<div
			class="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
		>
			<div class="flex items-center justify-between border-b px-4 py-3">
				<h3 class="font-semibold">Notifications</h3>
				<div class="flex gap-2">
					<Button
						variant="ghost"
						size="icon"
						class="h-6 w-6"
						onclick={() => notifications.markAllAsRead()}
						title="Mark all as read"
					>
						<Check class="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="h-6 w-6"
						onclick={addMockData}
						title="Add mock data"
					>
						<span class="text-xs">+</span>
					</Button>
				</div>
			</div>
			<div class="flex max-h-[400px] flex-col gap-1 overflow-y-auto p-2">
				{#if notifications.notifications.length === 0}
					<div class="p-4 text-center text-sm text-muted-foreground">No notifications yet.</div>
				{:else}
					{#each notifications.notifications as notification (notification.id)}
						<NotificationItem {notification} />
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
