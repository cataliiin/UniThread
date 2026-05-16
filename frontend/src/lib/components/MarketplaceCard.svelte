<script lang="ts">
	import type { MarketplaceListing } from '$lib/types/marketplace';
	import { categoryLabels, categoryIcons } from '$lib/types/marketplace';
	import { user } from '$lib/stores/user.svelte';
	import { Laptop, Shirt, Book, Armchair, Home, Wrench, Package } from '@lucide/svelte';

	let {
		listing,
		onToggleFavorite,
		onMarkSold,
		onDelete
	}: {
		listing: MarketplaceListing;
		onToggleFavorite?: (id: string) => void;
		onMarkSold?: (id: string) => void;
		onDelete?: (id: string) => void;
	} = $props();

	function formatPrice(cents: number): string {
		return (cents / 100).toFixed(2);
	}

	function formatTimeAgo(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 30) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}

	let isOwner = $derived(user?.id === listing.author_id);

	// Map backend 'housing' to frontend 'mentoring'
	let displayCategory = $derived(
		listing.category === 'housing' ? 'mentoring' : listing.category
	);

	const iconMap = {
		Laptop,
		Shirt,
		Book,
		Armchair,
		Home,
		Wrench,
		Package
	};

	let CategoryIcon = $derived.by(() => {
		const iconName = categoryIcons[displayCategory as keyof typeof categoryIcons] || 'Package';
		return iconMap[iconName as keyof typeof iconMap] || Package;
	});
</script>

<article
	class="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(50,65,95,0.1)]"
>
	<!-- Category Badge + Time -->
	<div class="mb-3 flex items-center justify-between">
		<span
			class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
		>
			<svelte:component this={CategoryIcon} size={16} />
			{categoryLabels[displayCategory as keyof typeof categoryLabels] || displayCategory}
		</span>
		<span class="text-xs text-muted-foreground/60">{formatTimeAgo(listing.created_at)}</span>
	</div>

	<!-- Title -->
	<h3 class="mb-2 text-lg font-semibold text-card-foreground line-clamp-2">
		{listing.title}
	</h3>

	<!-- Description -->
	<p class="mb-4 text-sm leading-relaxed text-card-foreground/70 line-clamp-2">
		{listing.description}
	</p>

	<!-- Price Row -->
	<div class="mb-4 flex items-center gap-3">
		<span class="text-2xl font-bold text-foreground">
			{formatPrice(listing.price)} <span class="text-sm font-normal text-muted-foreground">RON</span>
		</span>
		{#if listing.is_negotiable}
			<span
				class="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
			>
				Negotiable
			</span>
		{/if}
	</div>

	<!-- Author + Actions -->
	<div class="flex items-center justify-between border-t border-border/50 pt-3">
		<!-- Author -->
		<div class="flex items-center gap-2">
			<div
				class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
			>
				{listing.author.username.charAt(0).toUpperCase()}
			</div>
			<span class="text-xs text-muted-foreground">@{listing.author.username}</span>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-2">
			<!-- Favorite -->
			<button
				class="flex items-center gap-1 rounded-lg p-1.5 text-sm transition-all duration-300
				{listing.is_favorited
					? 'text-destructive'
					: 'text-muted-foreground hover:text-destructive'}"
				onclick={(e) => {
					e.stopPropagation();
					onToggleFavorite?.(listing.id);
				}}
				title={listing.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill={listing.is_favorited ? 'currentColor' : 'none'}
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path
						d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
					/></svg
				>
				<span class="text-xs">{listing.favorite_count}</span>
			</button>

			<!-- Owner actions -->
			{#if isOwner}
				<button
					class="rounded-lg p-1.5 text-xs text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
					onclick={(e) => {
						e.stopPropagation();
						onMarkSold?.(listing.id);
					}}
					title="Mark as sold"
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
						><polyline points="20 6 9 17 4 12" /></svg
					>
				</button>
				<button
					class="rounded-lg p-1.5 text-xs text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
					onclick={(e) => {
						e.stopPropagation();
						onDelete?.(listing.id);
					}}
					title="Delete listing"
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
						><polyline points="3 6 5 6 21 6" /><path
							d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
						/></svg
					>
				</button>
			{/if}
		</div>
	</div>
</article>
