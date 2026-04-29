import { api } from '../client';
import type { components } from '../schema';

type UserResponse = components["schemas"]["UserResponse"];
type UserProfileResponse = components["schemas"]["UserProfileResponse"];
type UserUpdateProfile = components["schemas"]["UserUpdateProfile"];
type UserChangePassword = components["schemas"]["UserChangePassword"];

export const UserService = {
	async getMe(customFetch?: typeof fetch): Promise<UserResponse> {
		const { data, error } = await api.GET('/api/v1/users/me', {
			fetch: customFetch
		});

		if (error) {
			throw new Error('Error fetching profile. Maybe session expired.');
		}

		return data as UserResponse;
	},

	async updateMe(payload: UserUpdateProfile, customFetch?: typeof fetch): Promise<UserResponse> {
		const { data, error } = await api.PATCH('/api/v1/users/me', {
			body: payload,
			fetch: customFetch
		});

		if (error) {
			throw new Error('Error updating profile');
		}

		return data as UserResponse;
	},

	async updatePassword(payload: UserChangePassword, customFetch?: typeof fetch): Promise<void> {
		const { error } = await api.PATCH('/api/v1/users/me/password', {
			body: payload,
			fetch: customFetch
		});

		if (error) {
			throw new Error(
				typeof error.detail === 'string'
					? error.detail
					: 'Error changing password'
			);
		}
	},

	async getProfile(userId: string, customFetch?: typeof fetch): Promise<UserProfileResponse> {
		const { data, error } = await api.GET('/api/v1/users/{user_id}', {
			params: { path: { user_id: userId } },
			fetch: customFetch
		});

		if (error) {
			throw new Error('Profile not found');
		}

		return data as UserProfileResponse;
	}
};
