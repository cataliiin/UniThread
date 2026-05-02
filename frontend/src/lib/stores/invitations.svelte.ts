import type { Invitation, InvitationResponse } from '$lib/types/invitation';
import { generateMockInvitations } from '$lib/types/invitation';
import { toasts } from './toast.svelte';
import { user } from './user.svelte';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function createInvitationsState() {
	let invitations = $state<Invitation[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Derived pending count for badge
	let pendingCount = $derived(invitations.filter((i) => i.status === 'pending').length);

	async function getAuthHeaders(): Promise<Record<string, string>> {
		if (typeof window === 'undefined') return {};
		const token = localStorage.getItem('token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	async function fetchInvitations(): Promise<void> {
		loading = true;
		error = null;

		try {
			const response = await fetch(`${API_BASE}/me/invitations`, {
				headers: await getAuthHeaders()
			});

			if (!response.ok) {
				throw new Error('Failed to fetch invitations');
			}

			const data: InvitationResponse[] = await response.json();

			// Enrich with community and inviter details
			// For now, use mock details since we don't have separate endpoints
			invitations = data.map((invite) => ({
				...invite,
				community_name: 'Loading...',
				inviter_name: 'Unknown'
			}));
		} catch {
			// Backend not available - fallback to localStorage (dev mode)
			if (typeof window !== 'undefined') {
				// Check localStorage first
				const saved = localStorage.getItem('mock_invitations');
				if (saved) {
					const cached = JSON.parse(saved);
					// If cached data has fewer items than expected, regenerate
					if (cached.length < 6) {
						invitations = generateMockInvitations();
						localStorage.setItem('mock_invitations', JSON.stringify(invitations));
					} else {
						invitations = cached;
					}
				} else {
					// Generate fresh mock data
					invitations = generateMockInvitations();
					localStorage.setItem('mock_invitations', JSON.stringify(invitations));
				}
			}
		} finally {
			loading = false;
		}
	}

	async function acceptInvitation(invitationId: string): Promise<boolean> {
		try {
			const response = await fetch(`${API_BASE}/me/invitations/${invitationId}/accept`, {
				method: 'POST',
				headers: await getAuthHeaders()
			});

			if (!response.ok) {
				throw new Error('Failed to accept invitation');
			}

			// Optimistic update
			invitations = invitations.filter((i) => i.id !== invitationId);

			// Find community name for toast
			const invitation = invitations.find((i) => i.id === invitationId);
			const communityName = invitation?.community_name || 'the community';

			toasts.show(`You joined ${communityName}!`, 'success');
			return true;
		} catch {
			// Backend not available - localStorage mode (dev)
			if (typeof window !== 'undefined') {
				const invitation = invitations.find((i) => i.id === invitationId);
				if (invitation) {
					// Remove from invitations
					invitations = invitations.filter((i) => i.id !== invitationId);
					localStorage.setItem('mock_invitations', JSON.stringify(invitations));

					// Add user as member to the community
					const communities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
					const community = communities.find((c: { id: string }) => c.id === invitation.community_id);
					if (community) {
						community.member_count = (community.member_count || 0) + 1;
						community.user_membership_status = 'approved';
						localStorage.setItem('mock_communities', JSON.stringify(communities));
					}

					toasts.show(`You joined ${invitation.community_name || 'the community'}!`, 'success');
					return true;
				}
			}
			return false;
		}
	}

	async function declineInvitation(invitationId: string): Promise<boolean> {
		try {
			const response = await fetch(`${API_BASE}/me/invitations/${invitationId}/decline`, {
				method: 'POST',
				headers: await getAuthHeaders()
			});

			if (!response.ok) {
				throw new Error('Failed to decline invitation');
			}

			// Optimistic update
			invitations = invitations.filter((i) => i.id !== invitationId);

			toasts.show('Invitation declined', 'info');
			return true;
		} catch {
			// Backend not available - localStorage mode (dev)
			if (typeof window !== 'undefined') {
				const invitation = invitations.find((i) => i.id === invitationId);
				if (invitation) {
					invitations = invitations.filter((i) => i.id !== invitationId);
					localStorage.setItem('mock_invitations', JSON.stringify(invitations));

					toasts.show('Invitation declined', 'info');
					return true;
				}
			}
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
