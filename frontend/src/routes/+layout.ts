import { redirect, error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import { HealthService } from '$lib/api/services';

export const ssr = false;

// Cache variables to prevent heavy, blocking health check HTTP calls on every client-side page navigation
let isInitialLoad = true;
let lastHealthCheckTime = 0;
let cachedHealthData: any = null;
const CACHE_DURATION_MS = 15000; // 15 seconds throttle

export const load: LayoutLoad = async ({ url }) => {
	// Ensure this re-runs on every navigation
	url.pathname;

	// 1. Health Check (Only blocks the initial SPA load. Subsequent navigations are non-blocking)
	if (isInitialLoad) {
		try {
			cachedHealthData = await HealthService.getHealth();
			lastHealthCheckTime = Date.now();
			isInitialLoad = false;
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
	} else {
		// Non-blocking background health check on navigation
		const now = Date.now();
		if (now - lastHealthCheckTime > CACHE_DURATION_MS) {
			HealthService.getHealth()
				.then((data) => {
					cachedHealthData = data;
					lastHealthCheckTime = Date.now();
				})
				.catch((err) => {
					console.error('Background health check failed:', err);
				});
		}
	}

	// Verify health from cache
	if (cachedHealthData && cachedHealthData.status === 'down') {
		throw error(503, {
			message: 'The database is currently unreachable. The system is down for maintenance.'
		});
	}

	if (cachedHealthData && cachedHealthData.status === 'degraded') {
		console.warn('Backend reported degraded status (MinIO offline). Some image features will fail.');
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
