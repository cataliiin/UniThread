import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	if (browser) {
		const saved = localStorage.getItem('currentUser');
		if (!saved) {
			throw redirect(307, '/login');
		}
		try {
			const data = JSON.parse(saved);
			if (!data.id) {
				throw redirect(307, '/login');
			}
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e) throw e; // re-throw SvelteKit redirect
			throw redirect(307, '/login');
		}
	}
	return {};
};
