import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { user } from '$lib/stores/user.svelte';

export const ssr = false;

export const load: PageLoad = async () => {
	if (!user.isAuthenticated) {
		throw redirect(307, '/login');
	}

	return {};
};
