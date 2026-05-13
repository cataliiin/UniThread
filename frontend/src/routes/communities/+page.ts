import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Community } from '$lib/types/community';

export const load: PageLoad = async () => {
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('currentUser');
		if (!saved) throw redirect(307, '/login');
		try {
			const userData = JSON.parse(saved);
			if (!userData.isAuthenticated) throw redirect(307, '/login');
		} catch {
			throw redirect(307, '/login');
		}
	}
	return {};
};
