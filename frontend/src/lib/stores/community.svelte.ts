import { goto } from '$app/navigation';
import type {
	Community,
	CommunityCreateRequest,
	CommunityFormData,
	CommunityUpdateRequest,
	PresignedUrlRequest,
	PresignedUrlResponse,
	CommunityMember
} from '$lib/types/community';
import { toasts } from './toast.svelte';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import type { components } from '$lib/api/openapi-generated-schema';
import { api } from '$lib/api/client';

type CommunityType = components['schemas']['CommunityType'];
type BucketName = components['schemas']['BucketName'];

function createCommunityState() {
	let currentCommunity = $state<Community | null>(null);
	let myCommunities = $state<Community[]>([]);
	let members = $state<CommunityMember[]>([]);
	let loading = $state(false);
	let membersLoading = $state(false);
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
			const communityData = await CommunitiesService.create({
				name: data.name,
				description: data.description,
				type: data.type as CommunityType,
				allow_anonymous: data.allow_anonymous || false,
				icon_key: data.icon_key,
				banner_key: data.banner_key
			});

			const community: Community = {
				id: communityData.id,
				name: communityData.name,
				description: communityData.description ?? null,
				type: communityData.type,
				allow_anonymous: communityData.allow_anonymous,
				icon_key: communityData.icon_key ?? null,
				banner_key: communityData.banner_key ?? null,
				university_id: communityData.university_id,
				owner_id: communityData.owner_id,
				created_at: communityData.created_at,
				member_count: communityData.member_count,
				user_membership_status: communityData.user_membership_status as any
			};

			currentCommunity = community;
			toasts.show('Community created successfully!', 'success');
			return community;
		} catch (error: any) {
			toasts.show(error.message || 'Failed to create community', 'error');
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
			const communityData = await CommunitiesService.update(communityId, {
				name: data.name,
				description: data.description,
				type: data.type as CommunityType,
				allow_anonymous: data.allow_anonymous,
				icon_key: data.icon_key,
				banner_key: data.banner_key
			});

			const community: Community = {
				...communityData,
				description: communityData.description ?? null,
				icon_key: communityData.icon_key ?? null,
				banner_key: communityData.banner_key ?? null,
				user_membership_status: communityData.user_membership_status as any
			};

			currentCommunity = community;
			toasts.show('Community updated successfully!', 'success');
			return community;
		} catch (error: any) {
			toasts.show(error.message || 'Failed to update community', 'error');
			return null;
		} finally {
			loading = false;
		}
	}

	async function fetchCommunity(communityId: string): Promise<Community | null> {
		loading = true;
		try {
			const communityData = await CommunitiesService.get(communityId);
			const community: Community = {
				...communityData,
				description: communityData.description ?? null,
				icon_key: communityData.icon_key ?? null,
				banner_key: communityData.banner_key ?? null,
				user_membership_status: communityData.user_membership_status as any
			};
			currentCommunity = community;
			return community;
		} catch (error) {
			currentCommunity = null;
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
			const { data } = await api.POST('/api/v1/storage/presigned-url', {
				body: { bucket_name: 'community-assets' as BucketName }
			});
			if (!data) return null;
			return data;
		} catch {
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

	async function fetchMyCommunities(): Promise<Community[]> {
		loading = true;
		try {
			const response = await fetch(`${API_BASE}/communities/me`, {
				headers: await getAuthHeaders()
			});
			if (!response.ok) throw new Error('Failed to fetch communities');
			const data: Community[] = await response.json();
			myCommunities = data;
			return data;
		} catch {
			// Fallback to localStorage (dev mode)
			if (typeof window !== 'undefined') {
				const all: Community[] = JSON.parse(localStorage.getItem('mock_communities') || '[]');
				myCommunities = all;
				return all;
			}
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchMembers(communityId: string): Promise<CommunityMember[]> {
		membersLoading = true;
		try {
			const response = await fetch(`${API_BASE}/communities/${communityId}/members`, {
				headers: await getAuthHeaders()
			});
			if (!response.ok) throw new Error('Failed to fetch members');
			const data: CommunityMember[] = await response.json();
			members = data;
			return data;
		} catch {
			// Fallback to mock data
			if (typeof window !== 'undefined') {
				const key = `mock_members_${communityId}`;
				const stored: CommunityMember[] = JSON.parse(localStorage.getItem(key) || '[]');
				// Seed with a default owner member if empty
				if (stored.length === 0) {
					const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
					const seed: CommunityMember[] = [
						{
							user_id: userData.email || 'local_user',
							username: userData.username || 'you',
							name: userData.name || 'You',
							community_id: communityId,
							status: 'approved',
							is_admin: true,
							joined_at: new Date().toISOString()
						}
					];
					localStorage.setItem(key, JSON.stringify(seed));
					members = seed;
					return seed;
				}
				members = stored;
				return stored;
			}
			return [];
		} finally {
			membersLoading = false;
		}
	}

	async function leaveCommunity(communityId: string): Promise<boolean> {
		try {
			const response = await fetch(`${API_BASE}/communities/${communityId}/leave`, {
				method: 'DELETE',
				headers: await getAuthHeaders()
			});
			if (!response.ok) throw new Error('Failed to leave community');
			toasts.show('Left community successfully', 'success');
			return true;
		} catch {
			// Mock: remove from localStorage
			if (typeof window !== 'undefined') {
				const all: Community[] = JSON.parse(localStorage.getItem('mock_communities') || '[]');
				const updated = all.filter((c) => c.id !== communityId);
				localStorage.setItem('mock_communities', JSON.stringify(updated));
				myCommunities = updated;
				toasts.show('Left community (local mode)', 'success');
				return true;
			}
			return false;
		}
	}

	async function promoteToAdmin(communityId: string, userId: string): Promise<boolean> {
		try {
			const response = await fetch(
				`${API_BASE}/communities/${communityId}/members/${userId}/promote`,
				{
					method: 'PATCH',
					headers: await getAuthHeaders()
				}
			);
			if (!response.ok) throw new Error('Failed to promote member');
			toasts.show('Member promoted to admin', 'success');
			return true;
		} catch {
			// Mock: update localStorage
			if (typeof window !== 'undefined') {
				const key = `mock_members_${communityId}`;
				const stored: CommunityMember[] = JSON.parse(localStorage.getItem(key) || '[]');
				const updated = stored.map((m) =>
					m.user_id === userId ? { ...m, is_admin: true } : m
				);
				localStorage.setItem(key, JSON.stringify(updated));
				members = updated;
				toasts.show('Member promoted (local mode)', 'success');
				return true;
			}
			return false;
		}
	}

	async function removeMember(communityId: string, userId: string): Promise<boolean> {
		try {
			const response = await fetch(
				`${API_BASE}/communities/${communityId}/members/${userId}`,
				{
					method: 'DELETE',
					headers: await getAuthHeaders()
				}
			);
			if (!response.ok) throw new Error('Failed to remove member');
			toasts.show('Member removed', 'success');
			return true;
		} catch {
			// Mock: update localStorage
			if (typeof window !== 'undefined') {
				const key = `mock_members_${communityId}`;
				const stored: CommunityMember[] = JSON.parse(localStorage.getItem(key) || '[]');
				const updated = stored.filter((m) => m.user_id !== userId);
				localStorage.setItem(key, JSON.stringify(updated));
				members = updated;
				toasts.show('Member removed (local mode)', 'success');
				return true;
			}
			return false;
		}
	}

	function reset() {
		currentCommunity = null;
		myCommunities = [];
		members = [];
		isAdmin = false;
		isOwner = false;
	}

	return {
		get currentCommunity() {
			return currentCommunity;
		},
		get myCommunities() {
			return myCommunities;
		},
		get members() {
			return members;
		},
		get loading() {
			return loading;
		},
		get membersLoading() {
			return membersLoading;
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
		fetchMyCommunities,
		fetchMembers,
		leaveCommunity,
		promoteToAdmin,
		removeMember,
		checkPermissions,
		getPresignedUrl,
		uploadFile,
		reset
	};
}

export const communityState = createCommunityState();
