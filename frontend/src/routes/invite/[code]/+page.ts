import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { InvitationsService } from '$lib/api/services/InvitationsService';

export const load: PageLoad = async ({ params }) => {
	try {
		const invite = await InvitationsService.previewInvite(params.code);
		return { invite };
	} catch (e) {
		throw error(404, 'This invite link is invalid or has expired');
	}
};
