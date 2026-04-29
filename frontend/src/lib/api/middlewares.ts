import type { Middleware } from 'openapi-fetch';

export const globalMiddleware: Middleware = {
	async onRequest({ request }) {
		const reqWithCredentials = new Request(request, {
			credentials: 'include'
		});
		
		return reqWithCredentials;
	},

	async onResponse({ response }) {
		if (response.status === 401) {
			if (typeof window !== 'undefined') {
				console.warn('[API] Authentication Error: 401 Unauthorized');
			}
		}

		return response;
	}
};
