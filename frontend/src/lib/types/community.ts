export type CommunityType = 'public' | 'request' | 'invite';

export interface Community {
	id: string;
	name: string;
	description: string | null;
	type: CommunityType;
	allow_anonymous: boolean;
	icon_key: string | null;
	banner_key: string | null;
	university_id: string;
	owner_id: string;
	created_at: string;
	member_count: number;
	user_membership_status: 'pending' | 'approved' | null;
}

export interface CommunityFormData {
	name: string;
	description: string;
	type: CommunityType;
	allow_anonymous: boolean;
	icon_key: string | null;
	banner_key: string | null;
}

export interface CommunityCreateRequest {
	name: string;
	description?: string;
	type: CommunityType;
	allow_anonymous?: boolean;
	icon_key?: string;
	banner_key?: string;
}

export interface CommunityUpdateRequest {
	name?: string;
	description?: string;
	type?: CommunityType;
	allow_anonymous?: boolean;
	icon_key?: string;
	banner_key?: string;
}

export interface PresignedUrlRequest {
	bucket_name: 'community_assets';
}

export interface PresignedUrlResponse {
	url: string;
	file_key: string;
}

export interface CommunityMember {
	user_id: string;
	community_id: string;
	status: 'pending' | 'approved';
	is_admin: boolean;
	joined_at: string;
}

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
