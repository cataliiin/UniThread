import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { InvitationsService } from '$lib/api/services/InvitationsService';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const invite = await InvitationsService.previewInvite(params.code);
		return { invite };
	} catch (e: any) {
		// Don't intercept auth redirects from middleware
		if (e.message === '__AUTH_REDIRECT__') throw e;

		console.error('Invite preview failed:', e);
		
		// If it's already a SvelteKit error, rethrow it
		if (e.status) throw e;

		throw error(404, {
			message: e.message || 'This invite link is invalid or has expired'
		});
	}
};
