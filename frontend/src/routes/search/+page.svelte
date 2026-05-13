<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Search from '$lib/components/Search.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { searchState } from '$lib/stores/search.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		if (!searchState.hasSearched && searchState.filter === 'all') {
			searchState.search('', 'all');
		}
	});
</script>

<svelte:head>
	<title>Search - UniThread</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
	<PageHeader title="Search" subtitle="Discover {user.university || 'University'}" />

	<Search />
</div>
