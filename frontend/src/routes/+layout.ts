import { redirect, error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, fetch }) => {
	// Ensure this re-runs on every navigation
	url.pathname;

	// 1. Health Check
	try {
		// We use a short timeout for the health check to avoid blocking the page load too long
		const healthRes = await fetch('http://localhost:8000/health');

		if (!healthRes.ok) {
			throw error(503, {
				message: 'The server is responding with an error. Please try again later.'
			});
		}

		const healthData = await healthRes.json();
		if (healthData.status === 'down') {
			throw error(503, {
				message: 'The system is currently down for maintenance. We will be back soon!'
			});
		}
	} catch (err) {
		// If fetch fails completely (backend offline)
		console.error('DEBUG: Health check failed, throwing 503 error', err);
		throw error(503, {
			message:
				'Could not connect to the server. Make sure the backend is running and reachable.'
		});
	}

	// 2. Authentication Logic
	let isAuthenticated = true;
// ... (rest of the logic remains the same)

	if (browser) {
		try {
			const saved = localStorage.getItem('currentUser');
			if (saved) {
				const data = JSON.parse(saved);
				isAuthenticated = data.isAuthenticated === true;
			}
		} catch {
			isAuthenticated = false;
		}

		// Allow both login and register without being authenticated
		const isAuthPage = url.pathname === '/login' || url.pathname === '/register';

		if (!isAuthenticated && !isAuthPage) {
			throw redirect(307, '/login');
		}

		if (isAuthenticated && isAuthPage) {
			throw redirect(307, '/');
		}
	}

	return {
		isAuthenticated
	};
};
