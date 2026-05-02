<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Community, CommunityFormData, CommunityType } from '$lib/types/community';
	import { communityTypeLabels } from '$lib/types/community';
	import { communityState } from '$lib/stores/community.svelte';
	import ImageUploader from './ImageUploader.svelte';
	import { toasts } from '$lib/stores/toast.svelte';

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
		!nameError &&
		!descriptionError &&
		formData.name.length >= 3 &&
		formData.name.length <= 100
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
		<h2 class="text-lg font-semibold text-white">Basic Information</h2>

		<div class="space-y-4">
			<div>
				<label for="name" class="mb-2 block text-sm font-medium text-slate-300">
					Community Name <span class="text-red-400">*</span>
				</label>
				<input
					type="text"
					id="name"
					bind:value={formData.name}
					onblur={handleNameBlur}
					placeholder="e.g., Computer Science Society"
					class="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					maxlength="100"
				/>
				{#if nameError}
					<p class="mt-1 text-sm text-red-400">{nameError}</p>
				{/if}
				<p class="mt-1 text-xs text-slate-500">{formData.name.length}/100 characters</p>
			</div>

			<div>
				<label for="description" class="mb-2 block text-sm font-medium text-slate-300">
					Description
				</label>
				<textarea
					id="description"
					bind:value={formData.description}
					onblur={handleDescriptionBlur}
					placeholder="Describe what your community is about..."
					rows="4"
					class="w-full resize-none rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					maxlength="1000"
				></textarea>
				{#if descriptionError}
					<p class="mt-1 text-sm text-red-400">{descriptionError}</p>
				{/if}
				<p class="mt-1 text-xs text-slate-500">{formData.description.length}/1000 characters</p>
			</div>
		</div>
	</div>

	<!-- Community Type Section -->
	<div class="space-y-6">
		<h2 class="text-lg font-semibold text-white">Community Type</h2>

		<div class="grid gap-4 sm:grid-cols-3">
			{#each Object.entries(communityTypeLabels) as [type, { label, description }]}
				<button
					type="button"
					onclick={() => handleTypeSelect(type as CommunityType)}
					class="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all {formData.type === type ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'}"
				>
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 rounded-full border-2 {formData.type === type ? 'border-indigo-500 bg-indigo-500' : 'border-slate-500'}"
						></div>
						<span class="font-medium text-white">{label}</span>
					</div>
					<p class="text-sm text-slate-400">{description}</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- Media Section -->
	<div class="space-y-6">
		<h2 class="text-lg font-semibold text-white">Community Media</h2>

		<div class="grid gap-6 sm:grid-cols-2">
			<ImageUploader
				imageUrl={iconUrl}
				onImageUpload={handleIconUpload}
				onImageRemove={handleIconRemove}
				aspectRatio="square"
				label="Community Icon (Recommended: 256x256)"
			/>

			<ImageUploader
				imageUrl={bannerUrl}
				onImageUpload={handleBannerUpload}
				onImageRemove={handleBannerRemove}
				aspectRatio="banner"
				label="Community Banner (Recommended: 1200x400)"
			/>
		</div>
	</div>

	<!-- Settings Section -->
	<div class="space-y-6">
		<h2 class="text-lg font-semibold text-white">Settings</h2>

		<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-600 bg-slate-800/50 p-4 transition-colors hover:border-slate-500">
			<input
				type="checkbox"
				bind:checked={formData.allow_anonymous}
				class="h-5 w-5 rounded border-slate-500 bg-slate-700 text-indigo-500 focus:ring-indigo-500/20"
			/>
			<div>
				<span class="block font-medium text-white">Allow Anonymous Posts</span>
				<span class="text-sm text-slate-400">Members can post without revealing their identity</span>
			</div>
		</label>
	</div>

	<!-- Action Buttons -->
	<div class="flex items-center justify-end gap-4 border-t border-slate-700 pt-6">
		<button
			type="button"
			onclick={handleCancel}
			class="rounded-lg px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
		>
			Cancel
		</button>
		<button
			type="submit"
			disabled={!isFormValid || communityState.loading}
			class="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if communityState.loading}
				<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
				<span>{mode === 'create' ? 'Creating...' : 'Saving...'}</span>
			{:else}
				<span>{mode === 'create' ? 'Create Community' : 'Save Changes'}</span>
			{/if}
		</button>
	</div>
</form>
