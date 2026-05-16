<script lang="ts">
	import './layout.css';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { themeState } from '$lib/stores/theme.svelte';
	import NotificationListener from '$lib/components/NotificationListener.svelte';
	import PhotoViewer from '$lib/components/PhotoViewer.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { page, navigating } from '$app/stores';
	import { HealthService } from '$lib/api/services';

	let { children } = $props();

	let isAuthPage = $derived($page.url.pathname === '/login' || $page.url.pathname === '/register' || $page.url.pathname === '/');

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
	<!-- Global High-End Top Navigation Loading Bar -->
	{#if $navigating}
		<div class="fixed top-0 left-0 right-0 z-[100] h-[3.5px] bg-primary/10 pointer-events-none overflow-hidden">
			<div class="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-loading-bar"></div>
		</div>
	{/if}

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
				<a href="/dashboard" class="flex items-center gap-2">
					<Logo className="h-7 w-7 text-foreground" />
					<span class="text-lg font-bold tracking-tight text-sidebar-foreground">UniThread</span>
				</a>
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
</div>

<ToastContainer />
<NotificationListener />
<PhotoViewer />

<svelte:head>
	<title>UniThread</title>
</svelte:head>

<style>
	@keyframes loading-bar {
		0% { width: 0%; }
		30% { width: 45%; }
		60% { width: 75%; }
		85% { width: 90%; }
		100% { width: 90%; }
	}
	.animate-loading-bar {
		animation: loading-bar 2.5s cubic-bezier(0.1, 0.8, 0.1, 1) forwards;
	}
</style>
