import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

type UserCreate = components['schemas']['UserCreate'];
type UserResponse = components['schemas']['UserResponse'];
type Token = components['schemas']['Token'];

type LoginPayload = {
	username: string;
	password: string;
	grant_type?: string | null;
	scope?: string;
	client_id?: string | null;
	client_secret?: string | null;
};

export const AuthService = {
	async register(payload: UserCreate): Promise<UserResponse> {
		const { data } = await api.POST('/api/v1/auth/register', { body: payload });
		return requireData(data);
	},

	async login(payload: LoginPayload): Promise<Token> {
		const form = new URLSearchParams();
		form.set('username', payload.username);
		form.set('password', payload.password);
		form.set('scope', payload.scope ?? '');

		if (payload.grant_type != null) {
			form.set('grant_type', payload.grant_type);
		} else {
			form.set('grant_type', 'password');
		}
		if (payload.client_id != null) {
			form.set('client_id', payload.client_id);
		}
		if (payload.client_secret != null) {
			form.set('client_secret', payload.client_secret);
		}

		const { data } = await api.POST('/api/v1/auth/login', {
			body: form as unknown as components['schemas']['Body_login_for_access_token_api_v1_auth_login_post'],
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});
		return requireData(data);
	},
};
