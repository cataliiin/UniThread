<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();

	// Check if we are on the login page
	let isLoginPage = $derived($page.url.pathname === '/login');
</script>

<div class="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
	<!-- Desktop Sidebar -->
	{#if !isLoginPage}
		<Sidebar />
	{/if}

	<!-- Content Area -->
	<div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto {isLoginPage ? '' : 'pb-20 lg:pb-0'}">
			{@render children()}
		</main>

		<!-- Mobile Navigation -->
		{#if !isLoginPage}
			<MobileNav />
		{/if}
	</div>
	<ToastContainer />
</div>

<svelte:head>
	<title>UniThread</title>
</svelte:head>
