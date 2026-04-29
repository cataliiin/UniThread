import { api } from '../client';
import type { components } from '../schema';

type UserCreate = components["schemas"]["UserCreate"];
type LoginParams = components["schemas"]["Body_login_for_access_token_api_v1_auth_login_post"];
type UserResponse = components["schemas"]["UserResponse"];

export const AuthService = {
	async register(payload: UserCreate, customFetch?: typeof fetch): Promise<UserResponse> {
		const { data, error } = await api.POST('/api/v1/auth/register', {
			body: payload,
			fetch: customFetch
		});

		if (error) {
			throw new Error(
				typeof error.detail === 'string' 
					? error.detail 
					: JSON.stringify(error.detail) || 'Registration error'
			);
		}

		return data as UserResponse;
	},

	async login(params: LoginParams, customFetch?: typeof fetch) {
		const { data, error } = await api.POST('/api/v1/auth/login', {
			body: params,
			bodySerializer: (b) => {
				const form = new URLSearchParams();
				for (const key in b) {
					const value = b[key as keyof typeof b];
					if (value !== undefined && value !== null) {
						form.append(key, String(value));
					}
				}
				return form.toString();
			},
			fetch: customFetch
		});

		if (error) {
			throw new Error(
				typeof error.detail === 'string'
					? error.detail
					: JSON.stringify(error.detail) || 'Authentication error (invalid credentials?)'
			);
		}

		return data;
	}
};
