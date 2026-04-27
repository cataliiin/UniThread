<script lang="ts">
	import './layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="layout-container">
	<Sidebar />

	<!-- Main Content -->
	<main class="main-content">
		{@render children()}
	</main>
</div>

<svelte:head>
	<title>UniThread</title>
</svelte:head>
