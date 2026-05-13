import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

type UserResponse = components['schemas']['UserResponse'];
type UserUpdateProfile = components['schemas']['UserUpdateProfile'];
type UserChangePassword = components['schemas']['UserChangePassword'];
type UserProfileResponse = components['schemas']['UserProfileResponse'];

export const UsersService = {
	async getMe(): Promise<UserResponse> {
		const { data } = await api.GET('/api/v1/users/me');
		return requireData(data);
	},

	async updateMe(payload: UserUpdateProfile): Promise<UserResponse> {
		const { data } = await api.PATCH('/api/v1/users/me', { body: payload });
		return requireData(data);
	},

	async changePassword(payload: UserChangePassword): Promise<void> {
		await api.PATCH('/api/v1/users/me/password', { body: payload });
	},

	async getUserProfile(userId: string): Promise<UserProfileResponse> {
		const { data } = await api.GET('/api/v1/users/{user_id}', {
			params: { path: { user_id: userId } },
		});
		return requireData(data);
	},
};
