<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Feed from '$lib/components/Feed.svelte';
	import { user } from '$lib/stores/user.svelte';
</script>

<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
	<PageHeader title="Feed" subtitle={user.university || 'University'} />

	<Feed />
</div>
