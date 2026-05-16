<script lang="ts">
	import './layout.css';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { themeState } from '$lib/stores/theme.svelte';
	import NotificationListener from '$lib/components/NotificationListener.svelte';
	import PhotoViewer from '$lib/components/PhotoViewer.svelte';
	import { HealthService } from '$lib/api/services';

	let { children } = $props();

	onMount(() => {
		themeState.applyTheme();

		// Check health every 60 seconds in the background (Idle Heartbeat)
		const interval = setInterval(async () => {
			try {
				const data = await HealthService.getHealth();

				if (data.status === 'down') {
					invalidateAll();
				}
			} catch (err) {
				// Server dropped while idle
				invalidateAll();
			}
		}, 60000);

		return () => clearInterval(interval);
	});
</script>

{@render children()}
<ToastContainer />
<NotificationListener />
<PhotoViewer />

<svelte:head>
	<title>UniThread</title>
</svelte:head>
