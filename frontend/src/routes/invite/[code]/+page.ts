import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { InvitationsService } from '$lib/api/services/InvitationsService';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const invite = await InvitationsService.previewInvite(params.code);
		return { invite };
	} catch (e: any) {

		if (e.status) throw e;

		throw error(404, {
			message: e.message || 'This invite link is invalid or has expired'
		});
	}
};
