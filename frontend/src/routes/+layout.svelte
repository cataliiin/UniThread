<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { themeState } from '$lib/stores/theme.svelte';
	import NotificationListener from '$lib/components/NotificationListener.svelte';
	import PhotoViewer from '$lib/components/PhotoViewer.svelte';
	import logo from '$lib/assets/UniThread_Logo.svg';
	import { HealthService } from '$lib/api/services';

	let { children } = $props();

	// Check if we are on the login or register page
	let isAuthPage = $derived($page.url.pathname === '/login' || $page.url.pathname === '/register');

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

<div class="flex h-screen overflow-hidden bg-background text-foreground">
	<!-- Desktop Sidebar -->
	{#if !isAuthPage}
		<Sidebar />
	{/if}

	<!-- Content Area -->
	<div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Mobile Header -->
		{#if !isAuthPage}
			<header
				class="flex items-center gap-3 border-b border-sidebar-border bg-sidebar p-4 lg:hidden"
			>
				<div
					class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-card border border-border p-0.5 shadow-lg shadow-primary/20"
				>
					<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
				</div>
				<span class="text-lg font-bold tracking-tight text-sidebar-foreground">UniThread</span>
			</header>
		{/if}

		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto {isAuthPage ? '' : 'pb-20 lg:pb-0'}">
			{@render children()}
		</main>

		<!-- Mobile Navigation -->
		{#if !isAuthPage}
			<MobileNav />
		{/if}
	</div>
	<ToastContainer />
	<NotificationListener />
	<PhotoViewer />
</div>

<svelte:head>
	<title>UniThread</title>
</svelte:head>
