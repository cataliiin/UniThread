import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

type InviteLinkPreviewResponse = components['schemas']['InviteLinkPreviewResponse'];
type CommunityMemberResponse = components['schemas']['CommunityMemberResponse'];
type CommunityInvitationResponse = components['schemas']['CommunityInvitationResponse'];

export const InvitationsService = {
	async previewInvite(code: string): Promise<InviteLinkPreviewResponse> {
		const { data } = await api.GET('/api/v1/invite/{code}', {
			params: { path: { code } },
		});
		return requireData(data);
	},

	async acceptInviteLink(code: string): Promise<CommunityMemberResponse> {
		const { data } = await api.POST('/api/v1/invite/{code}', {
			params: { path: { code } },
		});
		return requireData(data);
	},

	async listMyInvitations(): Promise<CommunityInvitationResponse[]> {
		const { data } = await api.GET('/api/v1/me/invitations');
		return requireData(data);
	},

	async acceptInvitation(inviteId: string): Promise<CommunityMemberResponse> {
		const { data } = await api.POST('/api/v1/me/invitations/{invite_id}/accept', {
			params: { path: { invite_id: inviteId } },
		});
		return requireData(data);
	},

	async declineInvitation(inviteId: string): Promise<void> {
		await api.POST('/api/v1/me/invitations/{invite_id}/decline', {
			params: { path: { invite_id: inviteId } },
		});
	},
};
