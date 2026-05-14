import type {
	MarketplaceListing,
	MarketplaceListingCreate,
	MarketplaceListingUpdate,
	MarketplaceSortOption,
	PaginatedMarketplaceResponse
} from '$lib/types/marketplace';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function getAuthHeaders(): Promise<Record<string, string>> {
	if (typeof window === 'undefined') return {};
	const token = localStorage.getItem('token');
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	};
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
	if (response.status === 401 && typeof window !== 'undefined') {
		localStorage.removeItem('token');
		localStorage.removeItem('currentUser');
		window.dispatchEvent(new Event('auth:expired'));
		throw new Error('__AUTH_REDIRECT__');
	}

	if (!response.ok) {
		let message = `${response.status} ${response.statusText}`;
		try {
			const data = await response.json();
			if (data?.error?.message) message = data.error.message;
			else if (typeof data?.detail === 'string') message = data.detail;
			else if (typeof data?.message === 'string') message = data.message;
		} catch {}
		throw new Error(message);
	}

	if (response.status === 204) return undefined as T;
	return response.json();
}

export const MarketplaceService = {
	async listListings(params: {
		page?: number;
		size?: number;
		q?: string;
		category?: string;
		min_price?: number;
		max_price?: number;
		sort?: MarketplaceSortOption;
	} = {}): Promise<PaginatedMarketplaceResponse> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set('page', params.page.toString());
		if (params.size) searchParams.set('size', params.size.toString());
		if (params.q) searchParams.set('q', params.q);
		if (params.category) searchParams.set('category', params.category);
		if (params.min_price !== undefined) searchParams.set('min_price', params.min_price.toString());
		if (params.max_price !== undefined) searchParams.set('max_price', params.max_price.toString());
		if (params.sort) searchParams.set('sort', params.sort);

		const qs = searchParams.toString();
		const url = `${API_BASE}/marketplace${qs ? `?${qs}` : ''}`;
		const response = await fetch(url, { 
			headers: await getAuthHeaders(),
			credentials: 'include'
		});
		return handleResponse<PaginatedMarketplaceResponse>(response);
	},

	async getListing(listingId: string): Promise<MarketplaceListing> {
		const response = await fetch(`${API_BASE}/marketplace/${listingId}`, {
			headers: await getAuthHeaders(),
			credentials: 'include'
		});
		return handleResponse<MarketplaceListing>(response);
	},

	async createListing(payload: MarketplaceListingCreate): Promise<MarketplaceListing> {
		const response = await fetch(`${API_BASE}/marketplace`, {
			method: 'POST',
			headers: await getAuthHeaders(),
			credentials: 'include',
			body: JSON.stringify(payload)
		});
		return handleResponse<MarketplaceListing>(response);
	},

	async updateListing(
		listingId: string,
		payload: MarketplaceListingUpdate
	): Promise<MarketplaceListing> {
		const response = await fetch(`${API_BASE}/marketplace/${listingId}`, {
			method: 'PATCH',
			headers: await getAuthHeaders(),
			credentials: 'include',
			body: JSON.stringify(payload)
		});
		return handleResponse<MarketplaceListing>(response);
	},

	async deleteListing(listingId: string): Promise<void> {
		const response = await fetch(`${API_BASE}/marketplace/${listingId}`, {
			method: 'DELETE',
			headers: await getAuthHeaders(),
			credentials: 'include'
		});
		return handleResponse<void>(response);
	},

	async listFavorites(
		page: number = 1,
		size: number = 20
	): Promise<PaginatedMarketplaceResponse> {
		const response = await fetch(
			`${API_BASE}/marketplace/favorites?page=${page}&size=${size}`,
			{ 
				headers: await getAuthHeaders(),
				credentials: 'include'
			}
		);
		return handleResponse<PaginatedMarketplaceResponse>(response);
	},

	async favoriteListing(listingId: string): Promise<void> {
		const response = await fetch(`${API_BASE}/marketplace/${listingId}/favorite`, {
			method: 'POST',
			headers: await getAuthHeaders(),
			credentials: 'include'
		});
		return handleResponse<void>(response);
	},

	async unfavoriteListing(listingId: string): Promise<void> {
		const response = await fetch(`${API_BASE}/marketplace/${listingId}/favorite`, {
			method: 'DELETE',
			headers: await getAuthHeaders(),
			credentials: 'include'
		});
		return handleResponse<void>(response);
	}
};
