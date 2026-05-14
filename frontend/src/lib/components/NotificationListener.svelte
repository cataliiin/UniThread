<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invitationsState } from '$lib/stores/invitations.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { notifications } from '$lib/stores/notification.svelte';
	import { NotificationType } from '$lib/types/notification';
	import { goto } from '$app/navigation';

	let pollInterval: any;
	let lastPendingCount = 0;
	let initialized = false;

	async function checkNotifications() {
		if (!user?.isAuthenticated) return;

		const oldCount = lastPendingCount;
		await invitationsState?.fetchInvitations();
		const newCount = invitationsState?.pendingCount || 0;

		// Sync with the Notifications dropdown (Hub)
		const currentPending = invitationsState.invitations.filter((i) => i.status === 'pending');

		currentPending.forEach((invite) => {
			const exists = notifications.notifications.find(
				(n) => n.type === NotificationType.Invitation && n.id === invite.id
			);
			if (!exists) {
				notifications.add({
					id: invite.id,
					type: NotificationType.Invitation,
					sender_id: invite.invited_by,
					sender_name: invite.inviter_name || 'Community Admin',
					receiver_id: user?.id || '',
					community_id: invite.community_id,
					community_name: invite.community_name || 'New Community',
					community_icon: null,
					message: `${invite.inviter_name || 'Someone'} invited you to join ${invite.community_name || 'a community'}`,
					read: false,
					created_at: new Date(invite.created_at),
					action_url: '/invitations'
				});
			}
		});

		if (initialized && newCount > oldCount) {
			const diff = newCount - oldCount;
			// Get the most recent invitation for the toast
			const lastInvite = currentPending[0];
			const toastMsg = lastInvite 
				? `${lastInvite.inviter_name || 'Someone'} invited you to join ${lastInvite.community_name || 'a community'}!`
				: `You have ${diff} new community invitation${diff > 1 ? 's' : ''}!`;

			toast.info(toastMsg, 8000, {
				label: 'See Invite',
				onClick: () => goto('/invitations')
			});
		}

		lastPendingCount = newCount;
		initialized = true;
	}

	onMount(() => {
		// Initial check
		checkNotifications();

		// Poll every 60 seconds (Idle Heartbeat)
		pollInterval = setInterval(checkNotifications, 60000);
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
	});
</script>
