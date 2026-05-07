import type { Invitation } from '$lib/types/invitation';
import { toasts } from './toast.svelte';
import { InvitationsService } from '$lib/api/services/InvitationsService';

function createInvitationsState() {
	let invitations = $state<Invitation[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Derived pending count for badge
	let pendingCount = $derived(invitations.filter((i) => i.status === 'pending').length);

	async function fetchInvitations(): Promise<void> {
		loading = true;
		error = null;

		try {
			const data = await InvitationsService.listMyInvitations();

			invitations = data.map((invite) => ({
				id: invite.id,
				community_id: invite.community_id,
				community_name: 'Community (ID: ' + invite.community_id.substring(0, 4) + ')', // Need backend to include name
				invited_by: invite.invited_by,
				inviter_name: 'User ' + invite.invited_by.substring(0, 4), // Need backend to include inviter details
				status: invite.status as 'pending' | 'accepted' | 'declined',
				created_at: invite.created_at
			}));
		} catch (e: any) {
			console.error("Failed to load invitations:", e);
			error = e.message || 'Failed to fetch invitations';
			invitations = [];
		} finally {
			loading = false;
		}
	}

	async function acceptInvitation(invitationId: string): Promise<boolean> {
		try {
			await InvitationsService.acceptInvitation(invitationId);

			// Optimistic update
			invitations = invitations.filter((i) => i.id !== invitationId);

			toasts.show('You joined the community!', 'success');
			return true;
		} catch (e: any) {
			toasts.show(e.message || 'Failed to accept invitation', 'error');
			return false;
		}
	}

	async function declineInvitation(invitationId: string): Promise<boolean> {
		try {
			await InvitationsService.declineInvitation(invitationId);

			// Optimistic update
			invitations = invitations.filter((i) => i.id !== invitationId);

			toasts.show('Invitation declined', 'info');
			return true;
		} catch (e: any) {
			toasts.show(e.message || 'Failed to decline invitation', 'error');
			return false;
		}
	}

	function clearInvitations() {
		invitations = [];
	}

	return {
		get invitations() {
			return invitations;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get pendingCount() {
			return pendingCount;
		},
		fetchInvitations,
		acceptInvitation,
		declineInvitation,
		clearInvitations
	};
}

export const invitationsState = createInvitationsState();
