<script lang="ts">
	import { onMount } from 'svelte';
	import { createMarketplaceState } from '$lib/stores/marketplace.svelte';
	import MarketplaceCard from '$lib/components/MarketplaceCard.svelte';
	import MarketplaceForm from '$lib/components/MarketplaceForm.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		allCategories,
		categoryLabels,
		sortLabels,
		type MarketplaceSortOption,
		type MarketplaceCategory,
		type MarketplaceListingCreate
	} from '$lib/types/marketplace';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Laptop, Shirt, Book, Armchair, Home, Wrench, Package, ShoppingBag, Heart } from '@lucide/svelte';

	const marketplace = createMarketplaceState();

	let scrollRef: HTMLDivElement;
	let searchDebounce: ReturnType<typeof setTimeout>;

	const iconMap = {
		Laptop,
		Shirt,
		Book,
		Armchair,
		Home,
		Wrench,
		Package
	};

	onMount(() => {
		marketplace.loadListings(true);

		// Infinite scroll observer
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !marketplace.loading && marketplace.hasMore) {
					marketplace.loadListings();
				}
			},
			{ threshold: 0.1 }
		);

		if (scrollRef) {
			observer.observe(scrollRef);
		}

		return () => observer.disconnect();
	});

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => {
			marketplace.filters.q = target.value;
			marketplace.applyFilters();
		}, 400);
	}

	async function handleCreateListing(data: MarketplaceListingCreate) {
		try {
			await marketplace.createListing(data);
			toast.success('Listing created successfully!');
		} catch (e) {
			toast.error((e as Error).message || 'Failed to create listing');
		}
	}

	async function handleMarkSold(id: string) {
		const ok = await marketplace.markSold(id);
		if (ok) toast.success('Listing marked as sold');
		else toast.error('Failed to mark as sold');
	}

	async function handleDelete(id: string) {
		const ok = await marketplace.deleteListing(id);
		if (ok) toast.success('Listing deleted');
		else toast.error('Failed to delete listing');
	}

	const sortOptions: MarketplaceSortOption[] = ['newest', 'oldest', 'price_asc', 'price_desc'];
</script>

<svelte:head>
	<title>Marketplace — UniThread</title>
	<meta
		name="description"
		content="Buy and sell items within your university community. Find textbooks, electronics, services, and more."
	/>
</svelte:head>

<div class="marketplace-page mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">Marketplace</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Buy and sell within your university community
			</p>
		</div>
		<Button
			onclick={() => marketplace.toggleCreateForm()}
			class="flex items-center gap-2 shadow-lg shadow-primary/20"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg
			>
			Create Listing
		</Button>
	</div>

	<!-- Create Form -->
	{#if marketplace.showCreateForm}
		<div class="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-card-foreground">New Listing</h2>
			<MarketplaceForm
				onSubmit={handleCreateListing}
				onCancel={() => marketplace.toggleCreateForm()}
				submitting={marketplace.creatingListing}
			/>
		</div>
	{/if}

	<!-- Tabs: All / Favorites -->
	<div class="mb-5 flex items-center gap-2 border-b border-border/50 pb-3">
		<button
			class="rounded-full px-5 py-2 text-sm font-medium transition-all duration-300
			{!marketplace.favoritesMode
				? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
				: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
			onclick={() => marketplace.setFavoritesMode(false)}
		>
			All Listings
		</button>
		<button
			class="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300
			{marketplace.favoritesMode
				? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
				: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
			onclick={() => marketplace.setFavoritesMode(true)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="currentColor"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path
					d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
				/></svg
			>
			Favorites
		</button>
	</div>

	<!-- Filters -->
	{#if !marketplace.favoritesMode}
		<div
			class="mb-6 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/50 p-4 sm:flex-row sm:items-end"
		>
			<!-- Search -->
			<div class="flex-1">
				<label for="mp-search" class="mb-1 block text-xs font-medium text-muted-foreground"
					>Search</label
				>
				<div class="relative">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						><circle cx="11" cy="11" r="8" /><line
							x1="21"
							x2="16.65"
							y1="21"
							y2="16.65"
						/></svg
					>
					<Input
						id="mp-search"
						type="text"
						placeholder="Search listings..."
						class="pl-9"
						value={marketplace.filters.q}
						oninput={handleSearchInput}
					/>
				</div>
			</div>

			<!-- Category -->
			<div class="sm:w-40">
				<label for="mp-category" class="mb-1 block text-xs font-medium text-muted-foreground"
					>Category</label
				>
				<select
					id="mp-category"
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					value={marketplace.filters.category}
					onchange={(e) =>
						marketplace.setCategory(
							(e.target as HTMLSelectElement).value as MarketplaceCategory | ''
						)}
				>
					<option value="">All</option>
					{#each allCategories as cat}
						<option value={cat}>
							{categoryLabels[cat]}
						</option>
					{/each}
				</select>
			</div>

			<!-- Price Range -->
			<div class="flex gap-2 sm:w-52">
				<div class="flex-1">
					<label for="mp-minprice" class="mb-1 block text-xs font-medium text-muted-foreground"
						>Min</label
					>
					<Input
						id="mp-minprice"
						type="number"
						placeholder="0"
						min="0"
						bind:value={marketplace.filters.min_price}
						onchange={() => marketplace.applyFilters()}
					/>
				</div>
				<div class="flex-1">
					<label for="mp-maxprice" class="mb-1 block text-xs font-medium text-muted-foreground"
						>Max</label
					>
					<Input
						id="mp-maxprice"
						type="number"
						placeholder="∞"
						min="0"
						bind:value={marketplace.filters.max_price}
						onchange={() => marketplace.applyFilters()}
					/>
				</div>
			</div>

			<!-- Sort -->
			<div class="sm:w-36">
				<label for="mp-sort" class="mb-1 block text-xs font-medium text-muted-foreground"
					>Sort</label
				>
				<select
					id="mp-sort"
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					value={marketplace.filters.sort}
					onchange={(e) =>
						marketplace.setSort((e.target as HTMLSelectElement).value as MarketplaceSortOption)}
				>
					{#each sortOptions as s}
						<option value={s}>{sortLabels[s]}</option>
					{/each}
				</select>
			</div>

			<!-- Reset -->
			<button
				class="self-end rounded-lg p-2.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
				onclick={() => marketplace.resetFilters()}
				title="Reset filters"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
						d="M3 3v5h5"
					/></svg
				>
			</button>
		</div>
	{/if}

	<!-- Results count -->
	<div class="mb-4 text-sm text-muted-foreground">
		{#if marketplace.totalItems > 0}
			{marketplace.totalItems} listing{marketplace.totalItems !== 1 ? 's' : ''} found
		{/if}
	</div>

	<!-- Listings Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each marketplace.listings as listing (listing.id)}
			<MarketplaceCard
				{listing}
				onToggleFavorite={marketplace.toggleFavorite}
				onMarkSold={handleMarkSold}
				onDelete={handleDelete}
			/>
		{/each}
	</div>

	<!-- Empty State -->
	{#if !marketplace.loading && marketplace.listings.length === 0}
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div
				class="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
			>
				{#if marketplace.favoritesMode}
					<Heart size={40} />
				{:else}
					<ShoppingBag size={40} />
				{/if}
			</div>
			<h3 class="mb-2 text-lg font-semibold text-foreground">
				{marketplace.favoritesMode ? 'No favorites yet' : 'No listings found'}
			</h3>
			<p class="max-w-md text-sm text-muted-foreground">
				{marketplace.favoritesMode
					? 'Save listings you like by tapping the heart icon.'
					: 'Be the first to create a listing, or try adjusting your filters.'}
			</p>
			{#if !marketplace.favoritesMode}
				<Button class="mt-4" onclick={() => marketplace.toggleCreateForm()}>
					Create a Listing
				</Button>
			{/if}
		</div>
	{/if}

	<!-- Loading / Infinite Scroll Trigger -->
	<div bind:this={scrollRef} class="py-6 text-center">
		{#if marketplace.loading}
			<div class="flex items-center justify-center gap-2 text-muted-foreground">
				<svg
					class="h-5 w-5 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span class="text-sm">Loading listings...</span>
			</div>
		{:else if !marketplace.hasMore && marketplace.listings.length > 0}
			<p class="text-sm text-muted-foreground/60">You've reached the end!</p>
		{/if}
	</div>
</div>
