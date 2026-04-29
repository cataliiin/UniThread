import createClient from 'openapi-fetch';
import type { paths } from './schema';
import { env } from '$env/dynamic/public';
import { globalMiddleware } from './middlewares';

export const api = createClient<paths>({
	baseUrl: env.PUBLIC_API_URL || 'http://127.0.0.1:8000'
});

api.use(globalMiddleware);

