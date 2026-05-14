<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Community, CommunityFormData, CommunityType } from '$lib/types/community';
	import { communityTypeLabels } from '$lib/types/community';
	import { communityState } from '$lib/stores/community.svelte';
	import ImageUploader from './ImageUploader.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { Input } from './ui/input';
	import { Textarea } from './ui/textarea';
	import { Label } from './ui/label';
	import { Button } from './ui/button';

	interface Props {
		community?: Community | null;
		mode: 'create' | 'edit';
	}

	let { community = null, mode }: Props = $props();

	// Form state
	let formData = $state<CommunityFormData>({
		name: '',
		description: '',
		type: 'public',
		allow_anonymous: false,
		icon_key: null,
		banner_key: null
	});

	// Sync formData when community prop changes (for edit mode)
	$effect(() => {
		if (community) {
			formData.name = community.name;
			formData.description = community.description || '';
			formData.type = community.type;
			formData.allow_anonymous = community.allow_anonymous;
			formData.icon_key = community.icon_key;
			formData.banner_key = community.banner_key;
		}
	});

	let touched = $state({
		name: false,
		description: false
	});

	// Validation
	const nameError = $derived.by(() => {
		if (!touched.name && mode === 'create') return '';
		if (!formData.name.trim()) return 'Community name is required';
		if (formData.name.length < 3) return 'Name must be at least 3 characters';
		if (formData.name.length > 100) return 'Name must be less than 100 characters';
		return '';
	});

	const descriptionError = $derived.by(() => {
		if (!touched.description) return '';
		if (formData.description.length > 1000) return 'Description must be less than 1000 characters';
		return '';
	});

	const isFormValid = $derived(
		!nameError && !descriptionError && formData.name.length >= 3 && formData.name.length <= 100
	);

	const iconUrl = $derived.by(() => {
		if (!formData.icon_key) return null;
		// If it's a localStorage key (starts with local_img_), get from localStorage
		if (formData.icon_key.startsWith('local_img_')) {
			return localStorage.getItem(formData.icon_key) || null;
		}
		// Otherwise use MinIO URL
		return `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000/community-assets'}/${formData.icon_key}`;
	});

	const bannerUrl = $derived.by(() => {
		if (!formData.banner_key) return null;
		// If it's a localStorage key (starts with local_img_), get from localStorage
		if (formData.banner_key.startsWith('local_img_')) {
			return localStorage.getItem(formData.banner_key) || null;
		}
		// Otherwise use MinIO URL
		return `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000/community-assets'}/${formData.banner_key}`;
	});

	function handleNameBlur() {
		touched.name = true;
	}

	function handleDescriptionBlur() {
		touched.description = true;
	}

	function handleTypeSelect(type: CommunityType) {
		formData.type = type;
	}

	function handleIconUpload(fileKey: string) {
		formData.icon_key = fileKey;
	}

	function handleIconRemove() {
		formData.icon_key = null;
	}

	function handleBannerUpload(fileKey: string) {
		formData.banner_key = fileKey;
	}

	function handleBannerRemove() {
		formData.banner_key = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		touched.name = true;
		touched.description = true;

		if (!isFormValid) {
			toasts.show('Please fix the errors before submitting', 'error');
			return;
		}

		const payload = {
			name: formData.name.trim(),
			description: formData.description.trim() || undefined,
			type: formData.type,
			allow_anonymous: formData.allow_anonymous,
			icon_key: formData.icon_key || undefined,
			banner_key: formData.banner_key || undefined
		};

		if (mode === 'create') {
			const result = await communityState.createCommunity(payload);
			if (result) {
				goto(`/communities/${result.id}`);
			}
		} else if (community) {
			const result = await communityState.updateCommunity(community.id, payload);
			if (result) {
				goto(`/communities/${result.id}`);
			}
		}
	}

	function handleCancel() {
		if (mode === 'edit' && community) {
			goto(`/communities/${community.id}`);
		} else {
			goto('/');
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-8">
	<!-- Basic Info Section -->
	<div class="space-y-6">
		<h2 class="text-lg font-semibold text-foreground">Basic Information</h2>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="name" class="text-muted-foreground">
					Community Name <span class="text-destructive">*</span>
				</Label>
				<Input
					id="name"
					bind:value={formData.name}
					onblur={handleNameBlur}
					placeholder="e.g., Computer Science Society"
					class="py-6 {nameError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
					maxlength={100}
				/>
				{#if nameError}
					<p class="text-xs text-destructive">{nameError}</p>
				{/if}
				<p class="text-[10px] font-medium text-muted-foreground/50 uppercase">{formData.name.length}/100 characters</p>
			</div>

			<div class="space-y-2">
				<Label for="description" class="text-muted-foreground">
					Description
				</Label>
				<Textarea
					id="description"
					bind:value={formData.description}
					onblur={handleDescriptionBlur}
					placeholder="Describe what your community is about..."
					class="min-h-[120px] resize-none {descriptionError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
					maxlength={1000}
				/>
				{#if descriptionError}
					<p class="text-xs text-destructive">{descriptionError}</p>
				{/if}
				<p class="text-[10px] font-medium text-muted-foreground/50 uppercase">{formData.description.length}/1000 characters</p>
			</div>
		</div>
	</div>

	<!-- Community Type Section -->
	<div class="space-y-6">
		<h2 class="text-lg font-semibold text-foreground">Community Type</h2>

		<div class="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
			{#each Object.entries(communityTypeLabels) as [type, { label, description }]}
				<button
					type="button"
					onclick={() => handleTypeSelect(type as CommunityType)}
					class="group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all {formData.type === type ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-lg shadow-primary/10' : 'border-border bg-muted/30 hover:border-border/80 hover:bg-muted'}"
				>
					<div class="flex items-center gap-2">
						<div
							class="flex h-5 w-5 items-center justify-center rounded-full border-2 {formData.type === type ? 'border-primary' : 'border-muted-foreground/30'}"
						>
							{#if formData.type === type}
								<div class="h-2.5 w-2.5 rounded-full bg-primary animate-in zoom-in-50 duration-300"></div>
							{/if}
						</div>
						<span class="font-bold text-foreground">{label}</span>
					</div>
					<p class="text-xs leading-relaxed text-muted-foreground">{description}</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- Media Section -->
	<div class="space-y-6">
		<h2 class="text-lg font-semibold text-foreground">Community Media</h2>

		<div class="space-y-6">
			<ImageUploader
				imageUrl={bannerUrl}
				onImageUpload={handleBannerUpload}
				onImageRemove={handleBannerRemove}
				aspectRatio="banner"
				label="Community Banner (Recommended: 1200x400)"
			/>

			<div class="max-w-[200px]">
				<ImageUploader
					imageUrl={iconUrl}
					onImageUpload={handleIconUpload}
					onImageRemove={handleIconRemove}
					aspectRatio="square"
					label="Community Icon"
				/>
			</div>
		</div>
	</div>

	<!-- Settings Section -->
	<div class="space-y-6">
		<h2 class="text-lg font-semibold text-foreground">Settings</h2>

		<label
			class="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-muted/50"
		>
			<input
				type="checkbox"
				bind:checked={formData.allow_anonymous}
				class="h-5 w-5 rounded border-muted-foreground/30 bg-muted text-primary focus:ring-primary/20 transition-all duration-300"
			/>
			<div>
				<span class="block font-medium text-foreground">Allow Anonymous Posts</span>
				<span class="text-sm text-muted-foreground"
					>Members can post without revealing their identity</span
				>
			</div>
		</label>
	</div>

	<!-- Action Buttons -->
	<div class="flex items-center justify-end gap-4 border-t border-border pt-6">
		<Button
			variant="outline"
			onclick={handleCancel}
			class="px-8"
		>
			Cancel
		</Button>
		<Button
			type="submit"
			disabled={!isFormValid || communityState.loading}
			class="px-8 shadow-lg shadow-primary/20"
		>
			{#if communityState.loading}
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
				></div>
				<span>{mode === 'create' ? 'Creating...' : 'Saving...'}</span>
			{:else}
				<span>{mode === 'create' ? 'Create Community' : 'Save Changes'}</span>
			{/if}
		</Button>
	</div>
</form>
