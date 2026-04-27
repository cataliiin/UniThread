<script lang="ts">
	import './layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
	<!-- Desktop Sidebar -->
	<Sidebar />

	<!-- Content Area -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
		<!-- Main Content -->
		<main class="flex-1 overflow-y-auto pb-20 lg:pb-0">
			{@render children()}
		</main>

		<!-- Mobile Navigation -->
		<MobileNav />
	</div>
</div>

<svelte:head>
	<title>UniThread</title>
</svelte:head>
