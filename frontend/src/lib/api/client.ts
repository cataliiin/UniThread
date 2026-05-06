import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from '$lib/api/openapi-generated-schema';
import { browser } from '$app/environment';

const publicBaseUrl = 'http://localhost:8000';

const baseUrl = !browser && publicBaseUrl.startsWith('/')
    ? 'http://backend:8000'
    : publicBaseUrl;

const middleware: Middleware = {
    async onRequest({ request }: { request: Request }): Promise<Request | void> {
        if (!request.headers.has('Accept')) {
            request.headers.set('Accept', 'application/json');
        }

        if (browser) {
            const token = localStorage.getItem('token');
            if (token && !request.headers.has('Authorization')) {
                request.headers.set('Authorization', `Bearer ${token}`);
            }
        }

        return request;
    },

    async onResponse({ response }: { response: Response }): Promise<Response | void> {
        if (response.ok) return response;

        let message = `${response.status} ${response.statusText}`;

        try {
            const data: any = await response.clone().json();

            if (typeof data?.message === 'string') {
                message = data.message;
            } else if (typeof data?.detail === 'string') {
                message = data.detail;
            } else if (Array.isArray(data?.detail)) {
                const firstError = data.detail[0];
                const field = firstError?.loc?.at(-1) ?? 'field';
                message = `${field}: ${firstError.msg}`;
            }
        } catch {}

        throw new Error(message);
    },

    async onError({ error }: { error: any }) {
        throw error instanceof Error ? error : new Error('Network error');
    },
};

export const api = createClient<paths>({
    baseUrl,
    credentials: 'include', // moved here — the only correct place
});

api.use(middleware);