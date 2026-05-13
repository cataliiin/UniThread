import type { PageLoad } from './$types';
import { UsersService } from '$lib/api/services/UsersService';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	if (params.id === 'anonymous') {
		throw error(404, 'Anonymous users do not have public profiles');
	}

	try {
		const userProfile = await UsersService.getUserProfile(params.id);
		return {
			targetUser: userProfile
		};
	} catch (err) {
		console.error('Failed to load user profile:', err);
		throw error(404, 'User not found');
	}
};
