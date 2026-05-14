import { MarketplaceService } from '$lib/api/services/MarketplaceService';
import type {
	MarketplaceListing,
	MarketplaceListingCreate,
	MarketplaceCategory,
	MarketplaceSortOption,
	MarketplaceFilters
} from '$lib/types/marketplace';

export function createMarketplaceState() {
	let listings = $state<MarketplaceListing[]>([]);
	let loading = $state(false);
	let page = $state(1);
	let hasMore = $state(true);
	let totalItems = $state(0);
	const pageSize = 20;

	let filters = $state<MarketplaceFilters>({
		q: '',
		category: '',
		min_price: '',
		max_price: '',
		sort: 'newest'
	});

	let favoritesMode = $state(false);
	let showCreateForm = $state(false);
	let creatingListing = $state(false);

	async function loadListings(reset = false) {
		if (loading) return;
		if (reset) {
			listings = [];
			page = 1;
			hasMore = true;
		}
		if (!hasMore && !reset) return;

		loading = true;

		try {
			let response;
			if (favoritesMode) {
				response = await MarketplaceService.listFavorites(page, pageSize);
			} else {
				const params: Record<string, any> = {
					page,
					size: pageSize,
					sort: filters.sort
				};
				if (filters.q.trim()) params.q = filters.q.trim();
				if (filters.category) params.category = filters.category;
				if (filters.min_price) {
					const min = parseInt(filters.min_price);
					if (!isNaN(min)) params.min_price = min;
				}
				if (filters.max_price) {
					const max = parseInt(filters.max_price);
					if (!isNaN(max)) params.max_price = max;
				}

				response = await MarketplaceService.listListings(params);
			}

			if (reset) {
				listings = response.items;
			} else {
				listings = [...listings, ...response.items];
			}
			totalItems = response.total;
			hasMore = page < response.pages;
			if (hasMore) page++;
		} catch (e) {
			console.error('Failed to load marketplace listings:', e);
			hasMore = false;
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		loadListings(true);
	}

	function setSort(sort: MarketplaceSortOption) {
		if (filters.sort === sort) return;
		filters.sort = sort;
		loadListings(true);
	}

	function setCategory(category: MarketplaceCategory | '') {
		filters.category = category;
		loadListings(true);
	}

	function setFavoritesMode(enabled: boolean) {
		if (favoritesMode === enabled) return;
		favoritesMode = enabled;
		loadListings(true);
	}

	async function toggleFavorite(listingId: string) {
		const idx = listings.findIndex((l) => l.id === listingId);
		if (idx === -1) return;

		const listing = listings[idx];
		const wasFavorited = listing.is_favorited;

		// Optimistic update
		listings = listings.map((l) => {
			if (l.id === listingId) {
				return {
					...l,
					is_favorited: !wasFavorited,
					favorite_count: wasFavorited ? l.favorite_count - 1 : l.favorite_count + 1
				};
			}
			return l;
		});

		try {
			if (wasFavorited) {
				await MarketplaceService.unfavoriteListing(listingId);
			} else {
				await MarketplaceService.favoriteListing(listingId);
			}

			// If in favorites mode and unfavorited, remove from list
			if (favoritesMode && wasFavorited) {
				listings = listings.filter((l) => l.id !== listingId);
			}
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
			// Revert optimistic update
			listings = listings.map((l) => {
				if (l.id === listingId) {
					return {
						...l,
						is_favorited: wasFavorited,
						favorite_count: wasFavorited ? l.favorite_count + 1 : l.favorite_count - 1
					};
				}
				return l;
			});
		}
	}

	async function createListing(data: MarketplaceListingCreate): Promise<boolean> {
		creatingListing = true;
		try {
			const newListing = await MarketplaceService.createListing(data);
			// Prepend to listings if not in favorites mode
			if (!favoritesMode) {
				listings = [newListing, ...listings];
				totalItems++;
			}
			showCreateForm = false;
			return true;
		} catch (e) {
			console.error('Failed to create listing:', e);
			throw e;
		} finally {
			creatingListing = false;
		}
	}

	async function markSold(listingId: string): Promise<boolean> {
		try {
			await MarketplaceService.updateListing(listingId, { is_active: false });
			listings = listings.filter((l) => l.id !== listingId);
			return true;
		} catch (e) {
			console.error('Failed to mark as sold:', e);
			return false;
		}
	}

	async function deleteListing(listingId: string): Promise<boolean> {
		try {
			await MarketplaceService.deleteListing(listingId);
			listings = listings.filter((l) => l.id !== listingId);
			totalItems--;
			return true;
		} catch (e) {
			console.error('Failed to delete listing:', e);
			return false;
		}
	}

	function resetFilters() {
		filters = {
			q: '',
			category: '',
			min_price: '',
			max_price: '',
			sort: 'newest'
		};
		loadListings(true);
	}

	function toggleCreateForm() {
		showCreateForm = !showCreateForm;
	}

	return {
		get listings() { return listings; },
		get loading() { return loading; },
		get hasMore() { return hasMore; },
		get totalItems() { return totalItems; },
		get filters() { return filters; },
		get favoritesMode() { return favoritesMode; },
		get showCreateForm() { return showCreateForm; },
		get creatingListing() { return creatingListing; },
		loadListings,
		applyFilters,
		setSort,
		setCategory,
		setFavoritesMode,
		toggleFavorite,
		createListing,
		markSold,
		deleteListing,
		resetFilters,
		toggleCreateForm
	};
}
