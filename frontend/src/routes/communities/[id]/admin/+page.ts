import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Community } from '$lib/types/community';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const load: PageLoad = async ({ params }) => {
	if (typeof window !== 'undefined') {
		const saved = sessionStorage.getItem('currentUser');
		if (!saved) throw redirect(307, '/login');

		let userData: { id?: string; email?: string; isAuthenticated?: boolean };
		try {
			userData = JSON.parse(saved);
		} catch {
			throw redirect(307, '/login');
		}
		if (!userData.isAuthenticated) throw redirect(307, '/login');

		// Verify admin status – check community
		const communityId = params.id;
		let isAdmin = false;

		try {
			const token = sessionStorage.getItem('token');
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (token) headers.Authorization = `Bearer ${token}`;
			const res = await fetch(`${API_BASE}/communities/${communityId}`, { headers });
			if (res.ok) {
				const community: Community = await res.json();
				isAdmin =
					community.owner_id === userData.id ||
					community.owner_id === userData.email ||
					community.user_membership_status === 'approved';
			}
		} catch {
			// Fallback: check sessionStorage
			const all: Community[] = JSON.parse(sessionStorage.getItem('mock_communities') || '[]');
			const community = all.find((c) => c.id === communityId);
			if (community) {
				isAdmin =
					community.owner_id === userData.id ||
					community.owner_id === userData.email;
			}
		}

		if (!isAdmin) throw redirect(307, `/communities/${params.id}`);
	}

	return { communityId: params.id };
};
