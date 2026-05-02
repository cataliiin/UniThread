import { goto } from '$app/navigation';
import type {
	Community,
	CommunityCreateRequest,
	CommunityFormData,
	CommunityUpdateRequest,
	PresignedUrlRequest,
	PresignedUrlResponse
} from '$lib/types/community';
import { toasts } from './toast.svelte';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function createCommunityState() {
	let currentCommunity = $state<Community | null>(null);
	let loading = $state(false);
	let isAdmin = $state(false);
	let isOwner = $state(false);

	async function getAuthHeaders(): Promise<Record<string, string>> {
		if (typeof window === 'undefined') return {};
		const token = localStorage.getItem('token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	async function createCommunity(data: CommunityCreateRequest): Promise<Community | null> {
		loading = true;
		try {
			const response = await fetch(`${API_BASE}/communities`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(await getAuthHeaders())
				},
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error?.message || 'Failed to create community');
			}

			const community: Community = await response.json();
			currentCommunity = community;
			toasts.show('Community created successfully!', 'success');
			return community;
		} catch {
			// Backend not available - fallback to localStorage (dev mode)
			if (typeof window !== 'undefined') {
				const userData = localStorage.getItem('currentUser');
				const user = userData ? JSON.parse(userData) : null;

				// Generate mock community
				const mockCommunity: Community = {
					id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					name: data.name,
					description: data.description || null,
					type: data.type,
					allow_anonymous: data.allow_anonymous || false,
					icon_key: data.icon_key || null,
					banner_key: data.banner_key || null,
					university_id: user?.university || 'local_university',
					owner_id: user?.email || 'local_user',
					created_at: new Date().toISOString(),
					member_count: 1,
					user_membership_status: 'approved'
				};

				// Save to localStorage
				const communities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
				communities.push(mockCommunity);
				localStorage.setItem('mock_communities', JSON.stringify(communities));

				currentCommunity = mockCommunity;
				toasts.show('Community created (local mode)!', 'success');
				return mockCommunity;
			}
			return null;
		} finally {
			loading = false;
		}
	}

	async function updateCommunity(
		communityId: string,
		data: CommunityUpdateRequest
	): Promise<Community | null> {
		loading = true;
		try {
			const response = await fetch(`${API_BASE}/communities/${communityId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					...(await getAuthHeaders())
				},
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				if (response.status === 403) {
					throw new Error('Only admins can edit this community');
				}
				const error = await response.json();
				throw new Error(error.error?.message || 'Failed to update community');
			}

			const community: Community = await response.json();
			currentCommunity = community;
			toasts.show('Community updated successfully!', 'success');
			return community;
		} catch {
			// Backend not available - fallback to localStorage (dev mode)
			if (typeof window !== 'undefined') {
				const communities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
				const index = communities.findIndex((c: Community) => c.id === communityId);

				if (index !== -1) {
					// Update existing
					const updated = { ...communities[index], ...data };
					communities[index] = updated;
					localStorage.setItem('mock_communities', JSON.stringify(communities));
					currentCommunity = updated;
					toasts.show('Community updated (local mode)!', 'success');
					return updated;
				}
			}
			return null;
		} finally {
			loading = false;
		}
	}

	async function fetchCommunity(communityId: string): Promise<Community | null> {
		loading = true;
		try {
			const response = await fetch(`${API_BASE}/communities/${communityId}`, {
				headers: await getAuthHeaders()
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Community not found');
				}
				throw new Error('Failed to fetch community');
			}

			const community: Community = await response.json();
			currentCommunity = community;
			return community;
		} catch {
			// Backend not available - fallback to localStorage (dev mode)
			if (typeof window !== 'undefined') {
				const communities = JSON.parse(localStorage.getItem('mock_communities') || '[]');
				const community = communities.find((c: Community) => c.id === communityId);
				if (community) {
					currentCommunity = community;
					return community;
				}
			}
			return null;
		} finally {
			loading = false;
		}
	}

	async function checkPermissions(communityId: string, userId: string): Promise<boolean> {
		const community = await fetchCommunity(communityId);
		if (!community) return false;

		isOwner = community.owner_id === userId;
		isAdmin = isOwner || community.user_membership_status === 'approved';

		return isAdmin;
	}

	async function getPresignedUrl(): Promise<PresignedUrlResponse | null> {
		try {
			const requestData: PresignedUrlRequest = { bucket_name: 'community_assets' };
			const response = await fetch(`${API_BASE}/storage/presigned-url`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(await getAuthHeaders())
				},
				body: JSON.stringify(requestData)
			});

			if (!response.ok) {
				return null;
			}

			return await response.json();
		} catch {
			// Backend not available, return null to trigger localStorage fallback
			// This is expected during development without backend
			return null;
		}
	}

	async function uploadFile(file: File, presignedUrl: string, fileKey: string): Promise<boolean> {
		try {
			const response = await fetch(presignedUrl, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type
				}
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			return true;
		} catch (error) {
			toasts.show('Failed to upload image', 'error');
			return false;
		}
	}

	function reset() {
		currentCommunity = null;
		isAdmin = false;
		isOwner = false;
	}

	return {
		get currentCommunity() {
			return currentCommunity;
		},
		get loading() {
			return loading;
		},
		get isAdmin() {
			return isAdmin;
		},
		get isOwner() {
			return isOwner;
		},
		createCommunity,
		updateCommunity,
		fetchCommunity,
		checkPermissions,
		getPresignedUrl,
		uploadFile,
		reset
	};
}

export const communityState = createCommunityState();
