<script lang="ts">
	import type { PageData } from './$types';
	import { categoryLabels, categoryIcons } from '$lib/types/marketplace';
	import { user } from '$lib/stores/user.svelte';
	import { StorageService } from '$lib/api/services/StorageService';
	import { MarketplaceService } from '$lib/api/services/MarketplaceService';
	import { toast } from '$lib/stores/toast.svelte';
	import { Button } from '$lib/components/ui/button';
	import { 
		ArrowLeft, 
		Package, 
		MessageSquare, 
		Heart, 
		Trash2, 
		CheckCircle,
		Laptop, 
		Shirt, 
		Book, 
		Armchair, 
		Home, 
		Wrench, 
		ShoppingBag
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data }: { data: PageData } = $props();
	let listing = $derived(data.listing);

	let isOwner = $derived(user?.isAuthenticated && user?.id === listing.author.id);
	
	let isFavorited = $state(false);
	let favoriteCount = $state(0);

	$effect(() => {
		if (listing) {
			isFavorited = listing.is_favorited;
			favoriteCount = listing.favorite_count;
		}
	});

	let confirmDeleteOpen = $state(false);
	let confirmSoldOpen = $state(false);

	let imageUrl = $derived(
		listing.image_key ? StorageService.getPublicUrl('marketplace-assets', listing.image_key) : null
	);

	const iconMap: Record<string, any> = {
		Laptop,
		Shirt,
		Book,
		Armchair,
		Home,
		Wrench,
		Package,
		ShoppingBag
	};

	const CategoryIcon = $derived(
		listing.category ? iconMap[categoryIcons[listing.category as keyof typeof categoryIcons]] || ShoppingBag : ShoppingBag
	);

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	async function handleToggleFavorite() {
		const wasFavorited = isFavorited;
		// Optimistic update
		isFavorited = !wasFavorited;
		favoriteCount = wasFavorited ? favoriteCount - 1 : favoriteCount + 1;

		try {
			if (wasFavorited) {
				await MarketplaceService.unfavoriteListing(listing.id);
				toast.success('Removed from favorites');
			} else {
				await MarketplaceService.favoriteListing(listing.id);
				toast.success('Added to favorites');
			}
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
			// Revert
			isFavorited = wasFavorited;
			favoriteCount = wasFavorited ? favoriteCount + 1 : favoriteCount - 1;
			toast.error('Failed to update favorite status');
		}
	}

	async function handleMarkSold() {
		try {
			await MarketplaceService.updateListing(listing.id, { is_active: false });
			toast.success('Item marked as sold');
			goto('/marketplace');
		} catch (e) {
			toast.error('Failed to update listing');
		}
	}

	async function handleDelete() {
		try {
			await MarketplaceService.deleteListing(listing.id);
			toast.success('Listing deleted successfully');
			goto('/marketplace');
		} catch (e) {
			toast.error('Failed to delete listing');
		}
	}
</script>

<svelte:head>
	<title>{listing.title} | UniThread Marketplace</title>
	<meta name="description" content={listing.description} />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<!-- Navigation Header -->
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<a 
			href="/marketplace" 
			class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
		>
			<ArrowLeft size={18} class="transition-transform group-hover:-translate-x-1" />
			Back to Marketplace
		</a>

		<!-- Action buttons (Owner or Favorite) -->
		<div class="flex items-center gap-2">
			{#if isOwner}
				<Button 
					variant="outline" 
					class="rounded-xl border-border hover:bg-muted text-foreground gap-2"
					onclick={() => confirmSoldOpen = true}
				>
					<CheckCircle size={18} />
					Mark as Sold
				</Button>
				<Button 
					variant="destructive" 
					class="rounded-xl gap-2 shadow-lg shadow-destructive/10"
					onclick={() => confirmDeleteOpen = true}
				>
					<Trash2 size={18} />
					Delete Listing
				</Button>
			{:else}
				<Button 
					variant="outline" 
					class="rounded-xl border-border hover:bg-muted text-foreground gap-2 {isFavorited ? 'text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10' : ''}"
					onclick={handleToggleFavorite}
				>
					<Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
					{isFavorited ? 'Favorited' : 'Favorite'} ({favoriteCount})
				</Button>
			{/if}
		</div>
	</div>

	<!-- Main Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
		<!-- Left Column: Image -->
		<div class="lg:col-span-6 xl:col-span-7 rounded-3xl border border-border/80 bg-muted/20 overflow-hidden shadow-md aspect-square md:aspect-[4/3] lg:aspect-[4/3] w-full flex items-center justify-center">
			{#if imageUrl}
				<img src={imageUrl} alt={listing.title} class="h-full w-full object-cover" />
			{:else}
				<div class="flex h-full w-full items-center justify-center bg-primary/5 text-primary/20">
					<Package size={140} class="stroke-[1.5]" />
				</div>
			{/if}
		</div>

		<!-- Right Column: Details -->
		<div class="lg:col-span-6 xl:col-span-5 space-y-6 bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-md">
			<!-- Category Badge -->
			<div>
				<span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
					<svelte:component this={CategoryIcon} size={14} />
					{categoryLabels[listing.category as keyof typeof categoryLabels] || listing.category}
				</span>
			</div>

			<!-- Title and Price -->
			<div class="space-y-3">
				<h1 class="text-3xl font-extrabold text-foreground leading-tight tracking-tight">{listing.title}</h1>
				<div class="flex items-baseline gap-3">
					<span class="text-4xl font-extrabold text-primary">
						{formatPrice(listing.price)} <span class="text-lg font-normal text-muted-foreground">RON</span>
					</span>
					{#if listing.is_negotiable}
						<span class="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
							Negotiable
						</span>
					{/if}
				</div>
			</div>

			<hr class="border-border/50" />

			<!-- Seller Info -->
			<div class="space-y-4">
				<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Seller Information</h3>
				<div class="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-lg text-primary">
						{listing.author.username.charAt(0).toUpperCase()}
					</div>
					<div class="flex flex-col">
						<span class="text-base font-semibold text-foreground">@{listing.author.username}</span>
						<span class="text-xs text-muted-foreground">UniThread Marketplace Member</span>
					</div>
				</div>
			</div>

			<!-- Description -->
			<div class="space-y-3 flex-1 flex flex-col min-h-0">
				<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Description</h3>
				<div class="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
					<div class="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
						{listing.description}
					</div>
				</div>
			</div>

			<!-- Message Action -->
			{#if !isOwner}
				<div class="pt-4">
					<Button 
						class="w-full gap-2 h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/20"
						onclick={() => alert('Messaging is not implemented yet')}
					>
						<MessageSquare size={22} />
						Message Seller
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: hsl(var(--border));
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--primary) / 0.2);
	}
</style>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete Listing"
	description="Are you sure you want to delete this listing? This action cannot be undone."
	confirmText="Delete"
	variant="destructive"
	onConfirm={handleDelete}
/>

<ConfirmDialog
	bind:open={confirmSoldOpen}
	title="Mark as Sold"
	description="Are you sure you want to mark this listing as sold? It will no longer be visible in the active marketplace."
	confirmText="Mark as Sold"
	variant="primary"
	onConfirm={handleMarkSold}
/>
