import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	// Set to true to access main page for development purposes
	const isAuthenticated = true;
	const isLoginPage = url.pathname === '/login';

	if (!isAuthenticated && !isLoginPage) {
		throw redirect(307, '/login');
	}

	if (isAuthenticated && isLoginPage) {
		throw redirect(307, '/');
	}

	return {
		isAuthenticated
	};
};
