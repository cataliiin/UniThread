<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import ErrorPage from '$lib/components/ErrorPage.svelte';

	let status = $derived($page.status || 500);
	let message = $derived($page.error?.message || 'An unexpected error occurred');

	onMount(() => {
		// Auto-recovery heartbeat
		const interval = setInterval(async () => {
			try {
				const res = await fetch('http://localhost:8000/health');
				const data = await res.json();
				if (res.ok && data.status !== 'down') {
					window.location.reload();
				}
			} catch (err) {
				// Still offline
			}
		}, 5000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Error {status} | UniThread</title>
</svelte:head>

<div style="background: #32415f; color: white; padding: 8px; text-align: center; font-size: 12px; font-weight: bold;">
	UniThread Custom Error Boundary (Status: {status})
</div>

<ErrorPage
	{status}
	title={status === 503 ? 'Service Unavailable' : 'Server Error'}
	{message}
	actions={[
		{ label: 'Try Again', onClick: () => window.location.reload(), variant: 'default' },
		{ label: 'Back Home', href: '/', variant: 'secondary' }
	]}
/>
