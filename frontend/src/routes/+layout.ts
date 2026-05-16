import { redirect, error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import { HealthService } from '$lib/api/services';

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
	// Ensure this re-runs on every navigation
	url.pathname;

	// 1. Health Check
	try {
		const healthData = await HealthService.getHealth();
		
		if (healthData.status === 'down') {
			throw error(503, {
				message: 'The database is currently unreachable. The system is down for maintenance.'
			});
		}
		
		if (healthData.status === 'degraded') {
			console.warn('Backend reported degraded status (MinIO offline). Some image features will fail.');
		}
	} catch (err: any) {
		// If it's already a SvelteKit error, rethrow it
		if (err.status && err.body) throw err;

		// If fetch fails completely (backend offline)
		console.error('DEBUG: Health check failed, throwing 503 error', err);
		throw error(503, {
			message:
				'Could not connect to the server. Make sure the backend is running and reachable.'
		});
	}

	// 2. Redirect authenticated users away from public pages
	if (browser) {
		const isPublicPage = url.pathname === '/' || url.pathname === '/login' || url.pathname === '/register';
		if (isPublicPage) {
			let isAuthenticated = false;
			try {
				const saved = localStorage.getItem('currentUser');
				if (saved) {
					const data = JSON.parse(saved);
					isAuthenticated = data.isAuthenticated === true || !!data.id;
				}
			} catch {
				// ignore
			}
			
			if (isAuthenticated) {
				throw redirect(307, '/dashboard');
			}
		}
	}

	return {};
};
