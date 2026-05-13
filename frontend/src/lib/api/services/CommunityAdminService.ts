import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

type CommunityJoinQuestionResponse = components['schemas']['CommunityJoinQuestionResponse'];
type CommunityJoinQuestionCreate = components['schemas']['CommunityJoinQuestionCreate'];
type CommunityJoinQuestionUpdate = components['schemas']['CommunityJoinQuestionUpdate'];
type JoinRequestResponse = components['schemas']['JoinRequestResponse'];
type CommunityMemberResponse = components['schemas']['CommunityMemberResponse'];
type CommunityInviteLinkResponse = components['schemas']['CommunityInviteLinkResponse'];
type CommunityInviteLinkCreate = components['schemas']['CommunityInviteLinkCreate'];
type CommunityInvitationResponse = components['schemas']['CommunityInvitationResponse'];
type CommunityInvitationCreate = components['schemas']['CommunityInvitationCreate'];
type CommunityRoleUpdate = components['schemas']['CommunityRoleUpdate'];

export const CommunityAdminService = {
	async listJoinQuestions(
		communityIdOrParams: string | { communityId: string }
	): Promise<CommunityJoinQuestionResponse[]> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const { data } = await api.GET('/api/v1/communities/{community_id}/questions', {
			params: { path: { community_id: communityId } },
		});
		return requireData(data);
	},

	async createJoinQuestion(
		communityIdOrParams: string | { communityId: string; payload: CommunityJoinQuestionCreate },
		payload?: CommunityJoinQuestionCreate
	): Promise<CommunityJoinQuestionResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const body =
			typeof communityIdOrParams === 'string'
				? payload
				: communityIdOrParams.payload;
		if (!body) {
			throw new Error('payload is required');
		}
		const { data } = await api.POST('/api/v1/communities/{community_id}/questions', {
			params: { path: { community_id: communityId } },
			body,
		});
		return requireData(data);
	},

	async updateJoinQuestion(
		communityIdOrParams:
			| string
			| { communityId: string; questionId: string; payload: CommunityJoinQuestionUpdate },
		questionId?: string,
		payload?: CommunityJoinQuestionUpdate
	): Promise<CommunityJoinQuestionResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const resolvedQuestionId =
			typeof communityIdOrParams === 'string'
				? questionId
				: communityIdOrParams.questionId;
		const body =
			typeof communityIdOrParams === 'string'
				? payload
				: communityIdOrParams.payload;
		if (!resolvedQuestionId || !body) {
			throw new Error('questionId and payload are required');
		}
		const { data } = await api.PATCH(
			'/api/v1/communities/{community_id}/questions/{question_id}',
			{
				params: {
					path: { community_id: communityId, question_id: resolvedQuestionId },
				},
				body,
			}
		);
		return requireData(data);
	},

	async deleteJoinQuestion(
		communityIdOrParams: string | { communityId: string; questionId: string },
		questionId?: string
	): Promise<void> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const resolvedQuestionId =
			typeof communityIdOrParams === 'string'
				? questionId
				: communityIdOrParams.questionId;
		if (!resolvedQuestionId) {
			throw new Error('questionId is required');
		}
		await api.DELETE('/api/v1/communities/{community_id}/questions/{question_id}', {
			params: { path: { community_id: communityId, question_id: resolvedQuestionId } },
		});
	},

	async listJoinRequests(
		communityIdOrParams: string | { communityId: string }
	): Promise<JoinRequestResponse[]> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const { data } = await api.GET('/api/v1/communities/{community_id}/requests', {
			params: { path: { community_id: communityId } },
		});
		return requireData(data);
	},

	async approveJoinRequest(
		communityIdOrParams: string | { communityId: string; userId: string },
		userId?: string
	): Promise<CommunityMemberResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const resolvedUserId =
			typeof communityIdOrParams === 'string'
				? userId
				: communityIdOrParams.userId;
		if (!resolvedUserId) {
			throw new Error('userId is required');
		}
		const { data } = await api.POST(
			'/api/v1/communities/{community_id}/requests/{user_id}/approve',
			{
				params: { path: { community_id: communityId, user_id: resolvedUserId } },
			}
		);
		return requireData(data);
	},

	async rejectJoinRequest(
		communityIdOrParams: string | { communityId: string; userId: string },
		userId?: string
	): Promise<void> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const resolvedUserId =
			typeof communityIdOrParams === 'string'
				? userId
				: communityIdOrParams.userId;
		if (!resolvedUserId) {
			throw new Error('userId is required');
		}
		await api.POST('/api/v1/communities/{community_id}/requests/{user_id}/reject', {
			params: { path: { community_id: communityId, user_id: resolvedUserId } },
		});
	},

	async listInviteLinks(
		communityIdOrParams: string | { communityId: string }
	): Promise<CommunityInviteLinkResponse[]> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const { data } = await api.GET('/api/v1/communities/{community_id}/invite-links', {
			params: { path: { community_id: communityId } },
		});
		return requireData(data);
	},

	async createInviteLink(
		communityIdOrParams: string | { communityId: string; payload: CommunityInviteLinkCreate },
		payload?: CommunityInviteLinkCreate
	): Promise<CommunityInviteLinkResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const body =
			typeof communityIdOrParams === 'string'
				? payload
				: communityIdOrParams.payload;
		if (!body) {
			throw new Error('payload is required');
		}
		const { data } = await api.POST('/api/v1/communities/{community_id}/invite-links', {
			params: { path: { community_id: communityId } },
			body,
		});
		return requireData(data);
	},

	async deleteInviteLink(
		communityIdOrParams: string | { communityId: string; linkId: string },
		linkId?: string
	): Promise<void> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const resolvedLinkId =
			typeof communityIdOrParams === 'string'
				? linkId
				: communityIdOrParams.linkId;
		if (!resolvedLinkId) {
			throw new Error('linkId is required');
		}
		await api.DELETE('/api/v1/communities/{community_id}/invite-links/{link_id}', {
			params: { path: { community_id: communityId, link_id: resolvedLinkId } },
		});
	},

	async createDirectInvitation(
		communityIdOrParams: string | { communityId: string; payload: CommunityInvitationCreate },
		payload?: CommunityInvitationCreate
	): Promise<CommunityInvitationResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const body =
			typeof communityIdOrParams === 'string'
				? payload
				: communityIdOrParams.payload;
		if (!body) {
			throw new Error('payload is required');
		}
		const { data } = await api.POST('/api/v1/communities/{community_id}/invitations', {
			params: { path: { community_id: communityId } },
			body,
		});
		return requireData(data);
	},

	async updateMemberRole(
		communityIdOrParams:
			| string
			| {
					communityId: string;
					userId: string;
					payload?: CommunityRoleUpdate;
					isAdmin?: boolean;
				},
		userId?: string,
		payloadOrIsAdmin?: CommunityRoleUpdate | boolean
	): Promise<CommunityMemberResponse> {
		const communityId =
			typeof communityIdOrParams === 'string'
				? communityIdOrParams
				: communityIdOrParams.communityId;
		const memberUserId =
			typeof communityIdOrParams === 'string'
				? userId
				: communityIdOrParams.userId;
		if (!memberUserId) {
			throw new Error('userId is required');
		}
		let body: CommunityRoleUpdate | undefined;
		if (typeof communityIdOrParams === 'string') {
			if (payloadOrIsAdmin === undefined) {
				throw new Error('payload is required');
			}
			body =
				typeof payloadOrIsAdmin === 'boolean'
					? { is_admin: payloadOrIsAdmin }
					: payloadOrIsAdmin;
		} else if (communityIdOrParams.payload) {
			body = communityIdOrParams.payload;
		} else if (typeof communityIdOrParams.isAdmin === 'boolean') {
			body = { is_admin: communityIdOrParams.isAdmin };
		}
		if (!body) {
			throw new Error('payload is required');
		}
		const { data } = await api.PATCH(
			'/api/v1/communities/{community_id}/members/{user_id}/role',
			{
				params: { path: { community_id: communityId, user_id: memberUserId } },
				body,
			}
		);
		return requireData(data);
	},
};
