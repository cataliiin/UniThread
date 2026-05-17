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
		<button 
			class="h-8 w-8 overflow-hidden rounded-full transition-opacity hover:opacity-80"
			onclick={() => goto(`/profile/${notification.sender_id}`)}
		>
			{#if notification.sender_avatar}
				<img src={notification.sender_avatar} alt="" class="h-full w-full object-cover" />
			{:else}
				<img
					src="https://ui-avatars.com/api/?name={notification.sender_name}&background=random"
					alt=""
					class="h-full w-full"
				/>
			{/if}
		</button>
	</div>

	<!-- Right Column: Text & Buttons -->
	<div class="flex flex-1 flex-col">
		<!-- Notification Text -->
		{#if notification.type === NotificationType.Invitation}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> invited you to join
				<strong>{notification.community_name}</strong>
			</div>
		{:else if notification.type === NotificationType.AcceptInvitation}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> accepted your invitation to join
				<strong>{notification.community_name}</strong>
			</div>
		{:else if notification.type === NotificationType.DeclineInvitation}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> declined your invitation to join
				<strong>{notification.community_name}</strong>
			</div>
		{:else if notification.type === NotificationType.JoinRequest}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> requested to join
				<strong>{notification.community_name}</strong>
			</div>
		{:else if notification.type === NotificationType.AcceptJoinRequest}
			<div class="text-sm">
				Your request to join <strong>{notification.community_name}</strong> was approved!
			</div>
		{:else if notification.type === NotificationType.DeclineJoinRequest}
			<div class="text-sm">
				Your request to join <strong>{notification.community_name}</strong> was declined.
			</div>
		{:else if notification.type === NotificationType.Message}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> sent you a message
			</div>
		{:else if notification.type === NotificationType.Post}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> posted a new post
			</div>
		{:else if notification.type === NotificationType.Like}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> liked your post
			</div>
		{:else if notification.type === NotificationType.Comment}
			<div class="text-sm">
				<button class="font-bold hover:text-primary transition-colors" onclick={() => goto(`/profile/${notification.sender_id}`)}>{notification.sender_name}</button> commented on your post
			</div>
		{/if}

		<div class="mt-2 flex flex-wrap items-center gap-2">
			{#if notification.type === NotificationType.Invitation}
				<Button variant="default" size="sm" onclick={goToInvitaions}>View</Button>
			{:else if notification.type === NotificationType.JoinRequest}
				<Button variant="default" size="sm" onclick={() => { handleRead(); goto(`/communities/${(notification as any).community_id}/requests`); }}>View Request</Button>
			{:else if notification.type === NotificationType.AcceptJoinRequest || notification.type === NotificationType.DeclineJoinRequest || notification.type === NotificationType.AcceptInvitation || notification.type === NotificationType.DeclineInvitation}
				<Button variant="default" size="sm" onclick={() => { handleRead(); goto(`/communities/${(notification as any).community_id}`); }}>View Community</Button>
			{:else if notification.type === NotificationType.Message}
				<Button variant="default" size="sm" onclick={goToMessages}>View</Button>
			{:else if notification.type === NotificationType.Post || notification.type === NotificationType.Like || notification.type === NotificationType.Comment}
				<Button variant="default" size="sm" onclick={() => goToPost((notification as any).post_id)}
					>View</Button
				>
			{/if}

			<Button variant="secondary" size="sm" onclick={handleRead}>Mark as Read</Button>
		</div>
	</div>
</div>
