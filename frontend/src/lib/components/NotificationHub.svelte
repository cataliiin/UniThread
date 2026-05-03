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

		notifications.add({
			id: Date.now().toString() + '2',
			type: NotificationType.Message,
			sender_id: '2',
			sender_name: 'Jane Doe',
			receiver_id: 'me',
			message: 'Send me a message!',
			read: false,
			created_at: new Date()
		});

		notifications.add({
			id: Date.now().toString() + '3',
			type: NotificationType.AcceptInvitation,
			sender_id: '3',
			sender_name: 'Bob Smith',
			receiver_id: 'me',
			community_id: '1',
			community_name: 'Community 1',
			community_icon: null,
			message: 'Bob Smith accepted your invitation!',
			read: false,
			created_at: new Date()
		});

		notifications.add({
			id: Date.now().toString() + '4',
			type: NotificationType.DeclineInvitation,
			sender_id: '4',
			sender_name: 'Alice Johnson',
			receiver_id: 'me',
			community_id: '1',
			community_name: 'Community 1',
			community_icon: null,
			message: 'Alice Johnson declined your invitation!',
			read: false,
			created_at: new Date()
		});

		notifications.add({
			id: Date.now().toString() + '5',
			type: NotificationType.Post,
			sender_id: '5',
			sender_name: 'Charlie Brown',
			receiver_id: 'me',
			post_id: '101',
			post_content: 'Check out my new post!',
			message: 'Charlie Brown posted a new post!',
			read: false,
			created_at: new Date()
		});

		notifications.add({
			id: Date.now().toString() + '6',
			type: NotificationType.Like,
			sender_id: '6',
			sender_name: 'David Lee',
			receiver_id: 'me',
			post_id: '102',
			post_content: 'I really liked this...',
			message: 'David Lee liked your post!',
			read: false,
			created_at: new Date()
		});

		notifications.add({
			id: Date.now().toString() + '7',
			type: NotificationType.Comment,
			sender_id: '7',
			sender_name: 'Eve Martinez',
			receiver_id: 'me',
			post_id: '103',
			post_content: 'Great point!',
			message: 'Eve Martinez commented on your post!',
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
