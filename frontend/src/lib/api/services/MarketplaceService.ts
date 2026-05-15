import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';
import type {
	MarketplaceListing,
	MarketplaceListingCreate,
	MarketplaceListingUpdate,
	MarketplaceSortOption,
	PaginatedMarketplaceResponse
} from '$lib/types/marketplace';

type MarketplaceCategory = components['schemas']['MarketplaceCategory'];

export const MarketplaceService = {
	async listListings(params: {
		page?: number;
		size?: number;
		q?: string;
		category?: MarketplaceCategory;
		min_price?: number;
		max_price?: number;
		sort?: string;
	} = {}): Promise<PaginatedMarketplaceResponse> {
		const { data } = await api.GET('/api/v1/marketplace', {
			params: {
				query: {
					page: params.page,
					size: params.size,
					q: params.q || undefined,
					category: params.category || undefined,
					min_price: params.min_price,
					max_price: params.max_price,
					sort: params.sort
				}
			}
		});
		return requireData(data) as PaginatedMarketplaceResponse;
	},

	async getListing(listingId: string): Promise<MarketplaceListing> {
		const { data } = await api.GET('/api/v1/marketplace/{listing_id}', {
			params: { path: { listing_id: listingId } }
		});
		return requireData(data) as MarketplaceListing;
	},

	async createListing(payload: MarketplaceListingCreate): Promise<MarketplaceListing> {
		const { data } = await api.POST('/api/v1/marketplace', { body: payload });
		return requireData(data) as MarketplaceListing;
	},

	async updateListing(
		listingId: string,
		payload: MarketplaceListingUpdate
	): Promise<MarketplaceListing> {
		const { data } = await api.PATCH('/api/v1/marketplace/{listing_id}', {
			params: { path: { listing_id: listingId } },
			body: payload
		});
		return requireData(data) as MarketplaceListing;
	},

	async deleteListing(listingId: string): Promise<void> {
		await api.DELETE('/api/v1/marketplace/{listing_id}', {
			params: { path: { listing_id: listingId } }
		});
	},

	async listFavorites(
		page: number = 1,
		size: number = 20
	): Promise<PaginatedMarketplaceResponse> {
		const { data } = await api.GET('/api/v1/marketplace/favorites', {
			params: { query: { page, size } }
		});
		return requireData(data) as PaginatedMarketplaceResponse;
	},

	async favoriteListing(listingId: string): Promise<void> {
		await api.POST('/api/v1/marketplace/{listing_id}/favorite', {
			params: { path: { listing_id: listingId } }
		});
	},

	async unfavoriteListing(listingId: string): Promise<void> {
		await api.DELETE('/api/v1/marketplace/{listing_id}/favorite', {
			params: { path: { listing_id: listingId } }
		});
	}
};

