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
import { CommunitiesService, CommunityAdminService } from '$lib/api/services';
import { StorageService } from '$lib/api/services';
import type { components } from '$lib/api/openapi-generated-schema';
import { user } from './user.svelte';
import type { CommunityRole } from '$lib/types/community';

type CommunityType = components['schemas']['CommunityType'];
type BucketName = components['schemas']['BucketName'];

function createCommunityState() {
	let currentCommunity = $state<Community | null>(null);
	let myCommunities = $state<Community[]>([]);
	let members = $state<CommunityMember[]>([]);
	let joinRequests = $state<components['schemas']['JoinRequestResponse'][]>([]);
	let loading = $state(false);
	let membersLoading = $state(false);
	let requestsLoading = $state(false);

	let lastFetchedMyCommunities = 0;
	const communityCache = new Map<string, { data: Community; timestamp: number }>();

	const userRole = $derived.by((): CommunityRole | null => {
		if (!currentCommunity || !user.id) return null;
		if (currentCommunity.owner_id === user.id) return 'owner';
		
		// Check if user is in the members list and is an admin
		const member = members.find(m => m.user_id === user.id);
		if (member?.is_admin) return 'admin';
		
		// Fallback to membership status if approved
		if (currentCommunity.user_membership_status === 'approved') return 'member';
		
		return null;
	});

	const isAdmin = $derived(userRole === 'owner' || userRole === 'admin');
	const isOwner = $derived(userRole === 'owner');
	const isMember = $derived(userRole !== null);

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

			const community: Community = communityData;

			currentCommunity = community;
			lastFetchedMyCommunities = 0; // force myCommunities re-fetch
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

			const community: Community = communityData;

			currentCommunity = community;
			communityCache.set(communityId, { data: community, timestamp: Date.now() });
			lastFetchedMyCommunities = 0; // force myCommunities re-fetch
			toasts.show('Community updated successfully!', 'success');
			return community;
		} catch (error: any) {
			toasts.show(error.message || 'Failed to update community', 'error');
			return null;
		} finally {
			loading = false;
		}
	}

	async function fetchCommunity(communityId: string, force = false): Promise<Community | null> {
		const cached = communityCache.get(communityId);
		if (!force && cached && Date.now() - cached.timestamp < 15000) {
			currentCommunity = cached.data;
			return currentCommunity;
		}

		loading = true;
		try {
			const communityData = await CommunitiesService.get(communityId);
			const community: Community = communityData;
			currentCommunity = community;
			communityCache.set(communityId, { data: community, timestamp: Date.now() });
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
		
		// If we are checking for the current user, the derived isAdmin/isOwner will handle it.
		// If we are checking for another user, we return based on owner_id for now.
		return community.owner_id === userId;
	}

	async function getPresignedUrl(): Promise<PresignedUrlResponse | null> {
		try {
			return await StorageService.getPresignedUrl('community-assets' as BucketName);
		} catch {
			return null;
		}
	}

	async function uploadFile(file: File, presignedUrl: string, fileKey: string): Promise<boolean> {
		try {
			await StorageService.uploadToPresignedUrl(presignedUrl, file);
			return true;
		} catch (error) {
			toasts.show('Failed to upload image', 'error');
			return false;
		}
	}

	async function fetchMyCommunities(force = false): Promise<Community[]> {
		if (!force && myCommunities.length > 0 && Date.now() - lastFetchedMyCommunities < 10000) {
			return myCommunities;
		}

		loading = true;
		try {
			const data = await CommunitiesService.listMyCommunities();
			myCommunities = data as Community[];
			lastFetchedMyCommunities = Date.now();
			return myCommunities;
		} catch (error) {
			console.error("Failed to fetch my communities:", error);
			myCommunities = [];
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchMembers(communityId: string): Promise<CommunityMember[]> {
		membersLoading = true;
		try {
			// Fetch both approved members and admins in parallel
			const [res, adminsRes] = await Promise.all([
				CommunitiesService.listMembers(communityId, 1, 100),
				CommunitiesService.listAdmins(communityId)
			]);
			
			const adminIds = new Set((adminsRes || []).map(a => a.id));
			const items = (res?.items || []) as CommunityMember[];
			
			const community = currentCommunity || await fetchCommunity(communityId);

			const data: CommunityMember[] = items.map((u) => {
				let displayName = u.username;
				if (u.first_name || u.last_name) {
					displayName = [u.first_name, u.last_name].filter(Boolean).join(' ');
				}

				return {
					...u,
					user_id: u.id,
					username: u.username,
					name: displayName,
					community_id: communityId,
					status: 'approved',
					// Cross-reference with admins list + check if owner
					is_admin: adminIds.has(u.id) || u.id === community?.owner_id,
					joined_at: u.joined_at || new Date().toISOString(),
					avatar_url: StorageService.getPublicUrl('user-assets', u.avatar_key) ?? undefined
				};
			});
			
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
				currentCommunity.user_membership_status = communityData.status;
				currentCommunity.member_count++;
			}
			communityCache.delete(communityId); // invalidate cache
			lastFetchedMyCommunities = 0; // force myCommunities re-fetch
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
			communityCache.delete(communityId); // invalidate cache
			lastFetchedMyCommunities = 0; // force myCommunities re-fetch
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
		// Basic safeguard
		if (userId === currentCommunity?.owner_id) {
			toasts.show('The owner is already an admin', 'info');
			return true;
		}

		try {
			await CommunityAdminService.updateMemberRole(communityId, userId, { is_admin: true });
			toasts.show('Member promoted to admin successfully', 'success');
			
			// Refresh local state
			await fetchMembers(communityId);
			return true;
		} catch (error: any) {
			const errorMsg = error.message || 'Failed to promote member';
			toasts.show(errorMsg, 'error');
			console.error('Promotion error:', error);
			return false;
		}
	}

	async function removeMember(communityId: string, userId: string): Promise<boolean> {
		try {
			await CommunityAdminService.kickMember(communityId, userId);
			toasts.show('Member removed', 'success');
			
			// Refresh members list
			await fetchMembers(communityId);
			return true;
		} catch (error: any) {
			toasts.show(error.message || 'Failed to remove member', 'error');
			return false;
		}
	}

	async function fetchJoinRequests(communityId: string) {
		requestsLoading = true;
		try {
			const res = await CommunityAdminService.listJoinRequests(communityId);
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
			await CommunityAdminService.approveJoinRequest(communityId, userId);
			
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
			await CommunityAdminService.rejectJoinRequest(communityId, userId);
			
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
		joinRequests = [];
		lastFetchedMyCommunities = 0;
		communityCache.clear();
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
		get isMember() {
			return isMember;
		},
		get userRole() {
			return userRole;
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
