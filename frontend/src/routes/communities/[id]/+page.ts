import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Community } from '$lib/types/community';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface UserData {
	id?: string;
	email?: string;
	isAuthenticated?: boolean;
}

export const load: PageLoad = async ({ params }) => {
	const communityId = params.id;

	// Check authentication on client side
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('currentUser');
		if (!saved) {
			throw redirect(307, '/login');
		}

		let userData: UserData;
		try {
			userData = JSON.parse(saved);
		} catch {
			throw redirect(307, '/login');
		}

		if (!userData.isAuthenticated) {
			throw redirect(307, '/login');
		}

		// Fetch community data
		try {
			// For local communities (mock data), skip API call and go directly to localStorage
			if (communityId.startsWith('local_')) {
				const communities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
				const community = communities.find((c: Community) => c.id === communityId);

				if (community) {
					const isOwner = community.owner_id === userData.id || community.owner_id === userData.email;
					const isAdmin = isOwner || community.user_membership_status === 'approved';

					return {
						community,
						isOwner,
						isAdmin
					};
				}
				throw error(404, 'Community not found');
			}

			const token = localStorage.getItem('token');
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}

			const response = await fetch(`${API_BASE}/communities/${communityId}`, {
				headers
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw error(404, 'Community not found');
				}
				throw new Error('Failed to fetch community');
			}

			const community: Community = await response.json();

			// Check permissions
			const isOwner = community.owner_id === userData.id;
			const isAdmin = isOwner || community.user_membership_status === 'approved';

			return {
				community,
				isOwner,
				isAdmin
			};
		} catch {
			// Backend not available - fallback to localStorage (dev mode)
			if (typeof window !== 'undefined') {
				const communities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
				const community = communities.find((c: Community) => c.id === communityId);

				if (community) {
					const isOwner = community.owner_id === userData.id || community.owner_id === userData.email;
					const isAdmin = isOwner || community.user_membership_status === 'approved';

					return {
						community,
						isOwner,
						isAdmin
					};
				}
			}

			throw error(404, 'Community not found');
		}
	}

	// Server-side rendering fallback
	return {
		community: null,
		isOwner: false,
		isAdmin: false
	};
};
