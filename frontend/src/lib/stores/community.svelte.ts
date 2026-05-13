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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function createCommunityState() {
	let currentCommunity = $state<Community | null>(null);
	let myCommunities = $state<Community[]>([]);
	let members = $state<CommunityMember[]>([]);
	let joinRequests = $state<any[]>([]); // Using any for now, matches JoinRequestResponse
	let loading = $state(false);
	let membersLoading = $state(false);
	let requestsLoading = $state(false);
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
		isAdmin = isOwner; // Only owner is admin for now

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
			// Try the dedicated endpoint first
			const response = await fetch(`${API_BASE}/communities/me`, {
				headers: await getAuthHeaders()
			});
			
			if (response.ok) {
				const data: Community[] = await response.json();
				myCommunities = data;
				return data;
			}
			
			// If not available, fallback to listing all and filtering
			const allCommRes = await CommunitiesService.list(1, 100);
			const filtered = allCommRes.items
				.filter(c => c.user_membership_status === 'approved' || c.owner_id === localStorage.getItem('currentUserId'))
				.map(c => ({
					...c,
					description: c.description ?? null,
					icon_key: c.icon_key ?? null,
					banner_key: c.banner_key ?? null,
					user_membership_status: c.user_membership_status as any
				}));
			
			myCommunities = filtered;
			return filtered;
		} catch (error) {
			console.error("Failed to fetch my communities:", error);
			// Final fallback to mock data
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
			const { data: res, error: apiError } = await api.GET('/api/v1/communities/{community_id}/members', {
				params: {
					path: { community_id: communityId },
					query: { page: 1, size: 100 }
				}
			});

			if (apiError) {
				const msg = (apiError as any).message || (apiError as any).detail || 'Failed to fetch members';
				throw new Error(typeof msg === 'string' ? msg : 'Failed to fetch members');
			}
			
			console.log('Members API Response for ' + communityId + ':', res);
			const items = res?.items || [];
			
			// We need community details for the owner check
			const community = currentCommunity || await fetchCommunity(communityId);

			const data: CommunityMember[] = items.map((u: any) => ({
				user_id: u.id,
				username: u.username,
				name: u.username,
				community_id: communityId,
				status: 'approved',
				is_admin: u.id === community?.owner_id,
				joined_at: new Date().toISOString(),
				avatar_url: u.avatar_key
			}));
			
			members = data;
			return data;
		} catch (error: any) {
			console.error("Fetch members error:", error);
			members = [];
			return [];
		} finally {
			membersLoading = false;
		}
	}

	async function joinCommunity(communityId: string): Promise<boolean> {
		loading = true;
		try {
			const communityData = await CommunitiesService.join(communityId);
			if (currentCommunity && currentCommunity.id === communityId) {
				currentCommunity.user_membership_status = communityData.status as any;
				currentCommunity.member_count++;
			}
			toasts.show(
				communityData.status === 'approved' 
					? 'Joined community successfully!' 
					: 'Join request sent successfully!', 
				'success'
			);
			return true;
		} catch (error: any) {
			toasts.show(error.message || 'Failed to join community', 'error');
			return false;
		} finally {
			loading = false;
		}
	}

	async function leaveCommunity(communityId: string): Promise<boolean> {
		loading = true;
		try {
			await CommunitiesService.leave(communityId);
			if (currentCommunity && currentCommunity.id === communityId) {
				currentCommunity.user_membership_status = null;
				currentCommunity.member_count--;
			}
			toasts.show('Left community successfully', 'success');
			return true;
		} catch (error: any) {
			toasts.show(error.message || 'Failed to leave community', 'error');
			return false;
		} finally {
			loading = false;
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

	async function fetchJoinRequests(communityId: string) {
		requestsLoading = true;
		try {
			const { data: res, error: apiError } = await api.GET('/api/v1/communities/{community_id}/requests', {
				params: { path: { community_id: communityId } }
			});

			if (apiError) throw new Error((apiError as any).detail || 'Failed to fetch requests');
			
			joinRequests = res || [];
			return joinRequests;
		} catch (error) {
			console.error('Fetch requests error:', error);
			joinRequests = [];
			return [];
		} finally {
			requestsLoading = false;
		}
	}

	async function approveJoinRequest(communityId: string, userId: string) {
		try {
			const { error: apiError } = await api.POST('/api/v1/communities/{community_id}/requests/{user_id}/approve', {
				params: { path: { community_id: communityId, user_id: userId } }
			});

			if (apiError) throw new Error((apiError as any).detail || 'Failed to approve request');
			
			toasts.show('Member approved!', 'success');
			// Refresh requests and member count
			await fetchJoinRequests(communityId);
			if (currentCommunity) {
				currentCommunity.member_count++;
			}
			return true;
		} catch (error: any) {
			toasts.show(error.message, 'error');
			return false;
		}
	}

	async function rejectJoinRequest(communityId: string, userId: string) {
		try {
			const { error: apiError } = await api.POST('/api/v1/communities/{community_id}/requests/{user_id}/reject', {
				params: { path: { community_id: communityId, user_id: userId } }
			});

			if (apiError) throw new Error((apiError as any).detail || 'Failed to reject request');
			
			toasts.show('Request rejected', 'success');
			await fetchJoinRequests(communityId);
			return true;
		} catch (error: any) {
			toasts.show(error.message, 'error');
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
		get joinRequests() {
			return joinRequests;
		},
		get loading() {
			return loading;
		},
		get membersLoading() {
			return membersLoading;
		},
		get requestsLoading() {
			return requestsLoading;
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
		fetchJoinRequests,
		approveJoinRequest,
		rejectJoinRequest,
		joinCommunity,
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
