import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import { user } from '$lib/stores/user.svelte';


export const load: PageLoad = async ({ params }) => {
	const communityId = params.id;

	try {
		const communityData = await CommunitiesService.get(communityId);

		const isOwner = communityData.owner_id === user?.id;
		const isAdmin = isOwner; // Only owner is admin by default unless role is checked

		return {
			community: communityData,
			isOwner,
			isAdmin
		};
	} catch (e: any) {
		throw error(404, 'Not found')
	}
};
