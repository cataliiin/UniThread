import type { Invitation } from '$lib/types/invitation';
import { toasts } from './toast.svelte';
import { InvitationsService } from '$lib/api/services/InvitationsService';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import { UsersService } from '$lib/api/services/UsersService';

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

			// Enrich invitations with community and inviter details in parallel
			const enrichedInvitations = await Promise.all(
				data.map(async (invite) => {
					try {
						const [community, inviter] = await Promise.all([
							CommunitiesService.get(invite.community_id).catch(() => null),
							UsersService.getUserProfile(invite.invited_by).catch(() => null)
						]);

						const inviterName = getAuthorDisplayName(inviter);
						const inviterDisplay = inviter && inviterName !== inviter.username 
							? `${inviterName} @${inviter.username}`
							: inviterName;

						return {
							id: invite.id,
							community_id: invite.community_id,
							community_name: community?.name || `Community (${invite.community_id.substring(0, 4)})`,
							invited_by: invite.invited_by,
							inviter_name: inviterDisplay,
							status: invite.status as 'pending' | 'accepted' | 'declined',
							created_at: invite.created_at
						};
					} catch (err) {
						return {
							id: invite.id,
							community_id: invite.community_id,
							community_name: `Community (${invite.community_id.substring(0, 4)})`,
							invited_by: invite.invited_by,
							inviter_name: `User ${invite.invited_by.substring(0, 4)}`,
							status: invite.status as 'pending' | 'accepted' | 'declined',
							created_at: invite.created_at
						};
					}
				})
			);

			invitations = enrichedInvitations;
		} catch (e: any) {
			console.error('Failed to load invitations:', e);
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
