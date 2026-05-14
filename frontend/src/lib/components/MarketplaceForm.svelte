<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import {
		allCategories,
		categoryLabels,
		type MarketplaceCategory,
		type MarketplaceListingCreate
	} from '$lib/types/marketplace';

	let {
		onSubmit,
		onCancel,
		submitting = false
	}: {
		onSubmit: (data: MarketplaceListingCreate) => void;
		onCancel: () => void;
		submitting?: boolean;
	} = $props();

	let formData = $state({
		title: '',
		description: '',
		category: 'other' as MarketplaceCategory,
		priceDisplay: '',
		is_negotiable: false
	});

	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!formData.title.trim()) newErrors.title = 'Title is required';
		if (!formData.description.trim()) newErrors.description = 'Description is required';

		const price = parseFloat(formData.priceDisplay);
		if (!formData.priceDisplay.trim() || isNaN(price) || price <= 0) {
			newErrors.price = 'Enter a valid price greater than 0';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!validate()) return;

		const priceInCents = Math.round(parseFloat(formData.priceDisplay) * 100);

		// Map frontend 'mentoring' category to backend 'housing' value
		const backendCategory =
			formData.category === ('mentoring' as MarketplaceCategory)
				? ('housing' as MarketplaceCategory)
				: formData.category;

		onSubmit({
			title: formData.title.trim(),
			description: formData.description.trim(),
			category: backendCategory,
			price: priceInCents,
			is_negotiable: formData.is_negotiable
		});
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5">
	<!-- Title -->
	<div class="space-y-2">
		<Label for="listing-title">Title</Label>
		<Input
			id="listing-title"
			placeholder="What are you selling?"
			bind:value={formData.title}
			class={errors.title ? 'border-destructive' : ''}
		/>
		{#if errors.title}
			<p class="text-xs text-destructive">{errors.title}</p>
		{/if}
	</div>

	<!-- Description -->
	<div class="space-y-2">
		<Label for="listing-description">Description</Label>
		<Textarea
			id="listing-description"
			placeholder="Describe your item, condition, availability..."
			bind:value={formData.description}
			rows={4}
			class={errors.description ? 'border-destructive' : ''}
		/>
		{#if errors.description}
			<p class="text-xs text-destructive">{errors.description}</p>
		{/if}
	</div>

	<!-- Category -->
	<div class="space-y-2">
		<Label for="listing-category">Category</Label>
		<select
			id="listing-category"
			bind:value={formData.category}
			class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			{#each allCategories as cat}
				<option value={cat}>{categoryLabels[cat]}</option>
			{/each}
		</select>
	</div>

	<!-- Price -->
	<div class="space-y-2">
		<Label for="listing-price">Price (RON)</Label>
		<div class="relative">
			<Input
				id="listing-price"
				type="number"
				step="0.01"
				min="0.01"
				placeholder="0.00"
				bind:value={formData.priceDisplay}
				class="pr-14 {errors.price ? 'border-destructive' : ''}"
			/>
			<span
				class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
			>
				RON
			</span>
		</div>
		{#if errors.price}
			<p class="text-xs text-destructive">{errors.price}</p>
		{/if}
	</div>

	<!-- Negotiable -->
	<div class="flex items-center space-x-2">
		<input
			type="checkbox"
			id="listing-negotiable"
			bind:checked={formData.is_negotiable}
			class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
		/>
		<Label for="listing-negotiable" class="font-normal">Price is negotiable</Label>
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-3 border-t border-border/50 pt-4">
		<Button variant="outline" type="button" onclick={onCancel}>Cancel</Button>
		<Button type="submit" disabled={submitting}>
			{submitting ? 'Creating...' : 'Create Listing'}
		</Button>
	</div>
</form>
