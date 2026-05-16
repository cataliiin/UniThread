import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { MarketplaceService } from '$lib/api/services/MarketplaceService';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const listing = await MarketplaceService.getListing(params.id);
		return { listing };
	} catch (e: any) {
		throw error(404, 'Listing not found.');
	}
};
