<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();

	// Check if we are on the login or register page
	let isAuthPage = $derived($page.url.pathname === '/login' || $page.url.pathname === '/register');
</script>

<div class="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
	<!-- Desktop Sidebar -->
	{#if !isAuthPage}
		<Sidebar />
	{/if}

	<!-- Content Area -->
	<div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
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
</div>

<svelte:head>
	<title>UniThread</title>
</svelte:head>
