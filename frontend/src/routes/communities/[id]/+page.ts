import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import { user } from '$lib/stores/user.svelte';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const communityId = params.id;

	if (!user?.isAuthenticated) {
		throw redirect(307, '/login');
	}

	try {
		const communityData = await CommunitiesService.get(communityId);
		
		const isOwner = communityData.owner_id === user?.email || communityData.owner_id === user?.id;
		const isAdmin = isOwner; // Only owner is admin by default unless role is checked

		return {
			community: communityData,
			isOwner,
			isAdmin
		};
	} catch (e: any) {
		console.error('Failed to fetch community:', e);
		throw error(404, e.message || 'Community not found');
	}
};
