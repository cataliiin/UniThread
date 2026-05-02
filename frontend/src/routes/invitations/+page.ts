import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Check authentication on client side
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('currentUser');
		if (!saved) {
			throw redirect(307, '/login');
		}
		const data = JSON.parse(saved);
		if (!data.isAuthenticated) {
			throw redirect(307, '/login');
		}
	}

	return {};
};
