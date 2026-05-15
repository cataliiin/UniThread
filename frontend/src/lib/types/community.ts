import type { components } from '$lib/api/openapi-generated-schema';

export type CommunityType = components['schemas']['CommunityType'];
export type CommunityRole = 'owner' | 'admin' | 'member';

// Base API types
export type ApiCommunity = components['schemas']['CommunityResponse'];

// The Community interface used in the UI is identical to the API response
export type Community = ApiCommunity;

export interface CommunityFormData {
	name: string;
	description: string;
	type: CommunityType;
	allow_anonymous: boolean;
	icon_key: string | null;
	banner_key: string | null;
}

export type CommunityCreateRequest = components['schemas']['CommunityCreate'];
export type CommunityUpdateRequest = components['schemas']['CommunityUpdate'];

export type PresignedUrlRequest = components['schemas']['PresignedUrlRequest'];
export type PresignedUrlResponse = components['schemas']['PresignedUrlResponse'];

export type ApiUserPublic = components['schemas']['UserPublic'];

// CommunityMember response from the API
export type ApiCommunityMember = components['schemas']['CommunityMemberResponse'];

// CommunityMember extends the API response with UI-specific fields for display
export type CommunityMember = ApiUserPublic & {
	// Optional display fields often joined in the UI or enriched via store
	id: string; // From ApiUserPublic
	user_id: string; // For backward compatibility
	community_id: string;
	is_admin: boolean;
	username?: string;
	name?: string;
	avatar_url?: string | null;
	joined_at?: string;
};

export const communityTypeLabels: Record<CommunityType, { label: string; description: string }> = {
	public: {
		label: 'Public',
		description: 'Anyone can join instantly'
	},
	request: {
		label: 'Approval Required',
		description: 'Admin approval required to join'
	},
	invite: {
		label: 'Invite Only',
		description: 'Access only via invite links or admin nomination'
	}
};
