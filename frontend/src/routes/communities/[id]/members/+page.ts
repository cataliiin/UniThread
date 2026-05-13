import { redirect, error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	if (typeof window !== 'undefined') {
		const saved = sessionStorage.getItem('currentUser');
		if (!saved) throw redirect(307, '/login');
		try {
			const userData = JSON.parse(saved);
			if (!userData.isAuthenticated) throw redirect(307, '/login');
		} catch {
			throw redirect(307, '/login');
		}
	}
	return { communityId: params.id };
};
