import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	let isAuthenticated = false;

	if (browser) {
		try {
			const saved = localStorage.getItem('currentUser');
			if (saved) {
				const data = JSON.parse(saved);
				isAuthenticated = data.isAuthenticated === true;
			}
		} catch {
			isAuthenticated = false;
		}

		// Allow both login and register without being authenticated
		const isAuthPage = url.pathname === '/login' || url.pathname === '/register';

		if (!isAuthenticated && !isAuthPage) {
			throw redirect(307, '/login');
		}

		if (isAuthenticated && isAuthPage) {
			throw redirect(307, '/');
		}
	}

	return {
		isAuthenticated
	};
};
