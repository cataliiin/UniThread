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
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import type { components } from '$lib/api/openapi-generated-schema';
import { api } from '$lib/api/client';

type CommunityType = components['schemas']['CommunityType'];
type BucketName = components['schemas']['BucketName'];

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
