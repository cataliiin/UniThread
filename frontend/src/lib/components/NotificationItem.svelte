<script lang="ts">
	import type { Notification } from '$lib/types/notification';
	import { NotificationType } from '$lib/types/notification';
	import { notifications } from '$lib/stores/notification.svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';

	let { notification } = $props<{
		notification: Notification;
	}>();

	function handleRead() {
		notifications.markAsRead(notification.id);
	}

	function goToInvitaions() {
		handleRead();
		goto('/invitations');
	}

	function goToMessages() {
		handleRead();
		goto('/messages');
	}
	function goToPost(post_id: string) {
		handleRead();
		goto(`/posts/${post_id}`);
	}
</script>

<div
	class="flex gap-3 rounded-lg p-4 transition-colors {notification.read
		? 'bg-background'
		: 'bg-muted/50'}"
>
	<!-- Left Column: Avatar (Shared by all notifications) -->
	<div class="shrink-0 pt-0.5">
		{#if notification.sender_avatar}
			<img src={notification.sender_avatar} alt="" class="h-8 w-8 rounded-full object-cover" />
		{:else}
			<img
				src="https://ui-avatars.com/api/?name={notification.sender_name}&background=random"
				alt=""
				class="h-8 w-8 rounded-full"
			/>
		{/if}
	</div>

	<!-- Right Column: Text & Buttons -->
	<div class="flex flex-1 flex-col">
		<!-- Notification Text -->
		{#if notification.type === NotificationType.Invitation}
			<div class="text-sm">
				<strong>{notification.sender_name}</strong> invited you to join
				<strong>{notification.community_name}</strong>
			</div>
		{:else if notification.type === NotificationType.AcceptInvitation}
			<div class="text-sm">
				<strong>{notification.sender_name}</strong> accepted your invitation to join
				<strong>{notification.community_name}</strong>
			</div>
		{:else if notification.type === NotificationType.DeclineInvitation}
			<div class="text-sm">
				<strong>{notification.sender_name}</strong> declined your invitation to join
				<strong>{notification.community_name}</strong>
			</div>
		{:else if notification.type === NotificationType.Message}
			<div class="text-sm">
				<strong>{notification.sender_name}</strong> sent you a message
			</div>
		{:else if notification.type === NotificationType.Post}
			<div class="text-sm">
				<strong>{notification.sender_name}</strong> posted a new post
			</div>
		{:else if notification.type === NotificationType.Like}
			<div class="text-sm">
				<strong>{notification.sender_name}</strong> liked your post
			</div>
		{:else if notification.type === NotificationType.Comment}
			<div class="text-sm">
				<strong>{notification.sender_name}</strong> commented on your post
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="mt-2 flex items-center gap-2">
			{#if notification.type === NotificationType.Invitation}
				<Button variant="default" size="sm" onclick={goToInvitaions}>View</Button>
			{:else if notification.type === NotificationType.Message}
				<Button variant="default" size="sm" onclick={goToMessages}>View</Button>
			{:else if notification.type === NotificationType.Post || notification.type === NotificationType.Like || notification.type === NotificationType.Comment}
				<Button variant="default" size="sm" onclick={() => goToPost(notification.post_id)}
					>View</Button
				>
			{/if}

			<Button variant="secondary" size="sm" onclick={handleRead}>Mark as Read</Button>
		</div>
	</div>
</div>
