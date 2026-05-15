import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import { user } from '$lib/stores/user.svelte';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const communityId = params.id;

	try {
		const communityData = await CommunitiesService.get(communityId);
		
		const isOwner = communityData.owner_id === user.email || communityData.owner_id === user.id;
		const isAdmin = isOwner || communityData.user_membership_status === 'approved';

		if (!isAdmin) {
			throw error(403, 'Only community admins can edit this community');
		}

		return {
			community: communityData,
			isOwner,
			isAdmin
		};
	} catch (e: any) {
		console.error('Failed to fetch community for edit:', e);
		throw error(404, e.message || 'Community not found');
	}
};
