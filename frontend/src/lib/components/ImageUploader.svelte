<script lang="ts">
	import { communityState } from '$lib/stores/community.svelte';

	interface Props {
		imageUrl: string | null;
		onImageUpload: (fileKey: string) => void;
		onImageRemove: () => void;
		aspectRatio?: 'square' | 'banner';
		label: string;
		accept?: string;
	}

	let {
		imageUrl,
		onImageUpload,
		onImageRemove,
		aspectRatio = 'square',
		label,
		accept = 'image/jpeg,image/png,image/webp'
	}: Props = $props();

	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let dragOver = $state(false);
	let fileInput: HTMLInputElement | null = $state(null);

	const aspectClasses = $derived(
		aspectRatio === 'banner' ? 'aspect-[3/1]' : 'aspect-square'
	);

	const maxSizeMB = 5;

	function validateFile(file: File): string | null {
		if (!file.type.startsWith('image/')) {
			return 'Please select an image file';
		}
		const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!validTypes.includes(file.type)) {
			return 'Only JPG, PNG, and WebP formats are supported';
		}
		if (file.size > maxSizeMB * 1024 * 1024) {
			return `File size must be less than ${maxSizeMB}MB`;
		}
		return null;
	}

	async function handleFile(file: File) {
		const error = validateFile(file);
		if (error) {
			alert(error);
			return;
		}

		isUploading = true;
		uploadProgress = 0;

		try {
			// Try MinIO first, fallback to localStorage
			const presignedData = await communityState.getPresignedUrl();

			if (presignedData) {
				// MinIO upload
				uploadProgress = 50;
				const success = await communityState.uploadFile(file, presignedData.url, presignedData.file_key);

				if (success) {
					uploadProgress = 100;
					onImageUpload(presignedData.file_key);
				} else {
					throw new Error('Upload failed');
				}
			} else {
				// Fallback: LocalStorage mode (for development)
				const reader = new FileReader();
				reader.onload = () => {
					const base64 = reader.result as string;
					// Store with unique key
					const key = `local_img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
					try {
						localStorage.setItem(key, base64);
						uploadProgress = 100;
						onImageUpload(key);
					} catch (e) {
						alert('Image too large for localStorage. Try a smaller image or use MinIO.');
					}
				};
				uploadProgress = 50;
				reader.readAsDataURL(file);
			}
		} catch {
			alert('Failed to upload image. Please try again.');
		} finally {
			isUploading = false;
			uploadProgress = 0;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file) {
			handleFile(file);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			handleFile(file);
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="space-y-2">
	<span class="block text-sm font-medium text-slate-300">{label}</span>

	{#if imageUrl}
		<div class="relative {aspectClasses} w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
			<img
				src={imageUrl}
				alt={label}
				class="h-full w-full object-cover"
			/>
			<div class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
				<button
					type="button"
					onclick={triggerFileInput}
					class="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-white"
				>
					Change
				</button>
				<button
					type="button"
					onclick={onImageRemove}
					class="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
				>
					Remove
				</button>
			</div>
		</div>
	{:else}
		<button
			type="button"
			onclick={triggerFileInput}
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			aria-label="Upload {label}"
			class="flex w-full flex-col items-center justify-center {aspectClasses} rounded-xl border-2 border-dashed transition-colors {dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}"
			disabled={isUploading}
		>
			{#if isUploading}
				<div class="flex flex-col items-center gap-2">
					<div class="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
					<span class="text-sm text-slate-400">Uploading... {uploadProgress}%</span>
				</div>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mb-2 text-slate-400"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" x2="12" y1="3" y2="15" />
				</svg>
				<span class="text-sm font-medium text-slate-300">Click or drag to upload</span>
				<span class="mt-1 text-xs text-slate-500">JPG, PNG, WebP up to 5MB</span>
			{/if}
		</button>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		{accept}
		class="hidden"
		onchange={handleFileSelect}
	/>
</div>
