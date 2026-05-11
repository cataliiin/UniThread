<script lang="ts">
	import CampusMap from '$lib/components/CampusMap.svelte';
</script>

<svelte:head>
	<title>Campus Map — UniThread</title>
	<meta name="description" content="Interactive map of all Transilvania University buildings in Brașov. Find addresses and directions to any faculty." />
</svelte:head>

<div class="map-page">
	<CampusMap />
</div>

<style>
	.map-page {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
