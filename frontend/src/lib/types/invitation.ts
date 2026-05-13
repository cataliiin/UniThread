export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Invitation {
	id: string;
	community_id: string;
	community_name?: string;
	community_icon?: string | null;
	community_description?: string;
	invited_by: string;
	inviter_name?: string;
	inviter_avatar?: string | null;
	status: InvitationStatus;
	created_at: string;
}

export interface InvitationResponse {
	id: string;
	community_id: string;
	invited_by: string;
	invited_user: string;
	status: InvitationStatus;
	created_at: string;
}

// Mock data generator for development
export function generateMockInvitations(): Invitation[] {
	const communities = [
		{ name: 'Computer Science', description: 'For CS students and enthusiasts', icon: null },
		{ name: 'Photography Society', description: 'Share your photos and learn techniques', icon: null },
		{ name: 'Music Lovers', description: 'Concerts, instruments, and music theory', icon: null },
		{ name: 'Sports Fan Club', description: 'All things sports - games, teams, events', icon: null },
		{ name: 'Startup Hub', description: 'Entrepreneurship and innovation', icon: null },
		{ name: 'Book Club', description: 'Monthly book discussions and recommendations', icon: null }
	];

	const inviters = [
		{ name: 'Alex Popescu', avatar: null },
		{ name: 'Maria Ionescu', avatar: null },
		{ name: 'John Smith', avatar: null },
		{ name: 'Emma Wilson', avatar: null },
		{ name: 'Carlos Garcia', avatar: null },
		{ name: 'Yuki Tanaka', avatar: null }
	];

	return communities.map((community, i) => {
		const inviter = inviters[i];
		const daysAgo = Math.floor(Math.random() * 7) + 1;
		const hoursAgo = Math.floor(Math.random() * 24);

		return {
			id: `local_invite_${Date.now()}_${i}`,
			community_id: `local_comm_${i}`,
			community_name: community.name,
			community_icon: community.icon,
			community_description: community.description,
			invited_by: `user_${i}`,
			inviter_name: inviter.name,
			inviter_avatar: inviter.avatar,
			status: 'pending',
			created_at: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString()
		};
	});
}
