import type { components } from '$lib/api/openapi-generated-schema';

export type MarketplaceCategory = components['schemas']['MarketplaceCategory'];
export type ApiListing = components['schemas']['MarketplaceListingResponse'];
export type MarketplaceListingCreate = components['schemas']['MarketplaceListingCreate'];
export type MarketplaceListingUpdate = components['schemas']['MarketplaceListingUpdate'];

/** Human-friendly labels for each backend category value */
export const categoryLabels: Record<MarketplaceCategory, string> = {
	electronics: 'Electronics',
	clothing: 'Clothing',
	books: 'Books',
	furniture: 'Furniture',
	housing: 'Housing',
	services: 'Services',
	other: 'Other'
};

/** Icon names for each category (Lucide icon names) */
export const categoryIcons: Record<MarketplaceCategory, string> = {
	electronics: 'Laptop',
	clothing: 'Shirt',
	books: 'Book',
	furniture: 'Armchair',
	housing: 'Home',
	services: 'Wrench',
	other: 'Package'
};

export const allCategories: MarketplaceCategory[] = [
	'electronics',
	'clothing',
	'books',
	'furniture',
	'housing',
	'services',
	'other'
];

export type MarketplaceSortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export const sortLabels: Record<MarketplaceSortOption, string> = {
	newest: 'Newest',
	oldest: 'Oldest',
	price_asc: 'Price ↑',
	price_desc: 'Price ↓'
};

/** UI-extended listing type */
export interface MarketplaceListing extends ApiListing {
	// Any UI-only fields can go here
}

export interface MarketplaceFilters {
	q: string;
	category: MarketplaceCategory | '';
	min_price: string;
	max_price: string;
	sort: MarketplaceSortOption;
}

export interface PaginatedMarketplaceResponse {
	items: MarketplaceListing[];
	total: number;
	page: number;
	size: number;
	pages: number;
}

