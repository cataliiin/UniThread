export type MarketplaceCategory =
	| 'electronics'
	| 'clothing'
	| 'books'
	| 'furniture'
	| 'mentoring'
	| 'services'
	| 'other';

/** Human-friendly labels for each backend category value */
export const categoryLabels: Record<MarketplaceCategory, string> = {
	electronics: 'Electronics',
	clothing: 'Clothing',
	books: 'Books',
	furniture: 'Furniture',
	mentoring: 'Mentoring',
	services: 'Services',
	other: 'Other'
};

/** Icons for each category (emoji shorthand) */
export const categoryIcons: Record<MarketplaceCategory, string> = {
	electronics: '💻',
	clothing: '👕',
	books: '📚',
	furniture: '🪑',
	mentoring: '🎓',
	services: '🔧',
	other: '📦'
};

export const allCategories: MarketplaceCategory[] = [
	'electronics',
	'clothing',
	'books',
	'furniture',
	'mentoring',
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

export interface MarketplaceAuthor {
	id: string;
	username: string;
	avatar_key: string | null;
}

export interface MarketplaceListing {
	id: string;
	university_id: string;
	author_id: string;
	title: string;
	description: string;
	category: MarketplaceCategory;
	price: number;
	image_key: string | null;
	is_active: boolean;
	is_negotiable: boolean;
	is_favorited: boolean;
	favorite_count: number;
	created_at: string;
	updated_at: string;
	author: MarketplaceAuthor;
}

export interface MarketplaceListingCreate {
	title: string;
	description: string;
	category: MarketplaceCategory;
	price: number;
	is_negotiable: boolean;
}

export interface MarketplaceListingUpdate {
	title?: string;
	description?: string;
	category?: MarketplaceCategory;
	price?: number;
	is_active?: boolean;
	is_negotiable?: boolean;
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
