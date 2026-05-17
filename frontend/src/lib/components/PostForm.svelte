<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { toast } from '$lib/stores/toast.svelte';
	import { PostsService, StorageService } from '$lib/api/services';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';
	import type { Post } from '$lib/types/post';
	import ImageUploader from '$lib/components/ImageUploader.svelte';
	import CommunitySelector from './CommunitySelector.svelte';

	interface Props {
		post?: Post | null;
		communities?: any[];
		mode: 'create' | 'edit';
		defaultCommunityId?: string | null;
		onSuccess?: () => void;
		layout?: 'default' | 'compact';
	}

	let {
		post = null,
		communities = [],
		mode,
		defaultCommunityId = null,
		onSuccess,
		layout = 'default'
	}: Props = $props();

	// Form state
	let formData = $state({
		title: '',
		body: '',
		community_id: '',
		is_anonymous: false,
		is_announcement: false,
		image_key: null as string | null
	});

	// Sync formData with props
	$effect(() => {
		if (defaultCommunityId && !formData.community_id) {
			formData.community_id = defaultCommunityId;
		}
	});

	let isSubmitting = $state(false);

	// Sync formData when post prop changes (for edit mode)
	$effect(() => {
		if (post) {
			const isAnn = post.title.startsWith('📢 ANNOUNCEMENT: ');
			formData.title = isAnn ? post.title.replace('📢 ANNOUNCEMENT: ', '') : post.title;
			formData.is_announcement = isAnn;
			formData.body = post.body || '';
			formData.image_key = post.image_key || null;
		} else if (communities.length > 0 && !formData.community_id) {
			formData.community_id = defaultCommunityId || communities[0].id;
		}
	});

	let errors = $state<Record<string, string>>({});

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!formData.title.trim()) {
			newErrors.title = 'Title is required';
		}
		if (!formData.body.trim()) {
			newErrors.body = 'Content is required';
		}
		if (mode === 'create' && !formData.community_id) {
			newErrors.community_id = 'Please select a community';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Reactively clear errors when fields become valid
	$effect(() => {
		if (formData.title.trim() && errors.title) {
			errors.title = '';
		}
	});
	$effect(() => {
		if (formData.body.trim() && errors.body) {
			errors.body = '';
		}
	});
	$effect(() => {
		if (formData.community_id && errors.community_id) {
			errors.community_id = '';
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!validate()) {
			toast.error('Please fill in the required fields.');
			return;
		}

		if (formData.body.length > 5000) {
			errors.body = 'Content cannot exceed 5000 characters.';
			toast.error('Content cannot exceed 5000 characters.');
			return;
		}

		isSubmitting = true;

		try {
			if (mode === 'create') {
				const titlePrefix = formData.is_announcement ? '📢 ANNOUNCEMENT: ' : '';
				const result = await PostsService.createPost({
					title: titlePrefix + formData.title.trim(),
					body: formData.body.trim(),
					community_id: formData.community_id,
					is_anonymous: formData.is_anonymous,
					image_key: formData.image_key
				});
				toast.success('Post created successfully!');
				onSuccess?.();
				goto(`/communities/${formData.community_id}`);
			} else if (post) {
				const titlePrefix = formData.is_announcement ? '📢 ANNOUNCEMENT: ' : '';
				const result = await PostsService.updatePost(post.id.toString(), {
					title: titlePrefix + formData.title.trim(),
					body: formData.body.trim(),
					image_key: formData.image_key
				});
				toast.success('Post updated successfully!');
				onSuccess?.();
				goto(`/posts/${post.id}`);
			}
		} catch (e: any) {
			toast.error(e.message || `Could not ${mode} post.`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if layout === 'compact'}
	<!-- Compact Layout (optimized for Modals/Dialogs) -->
	<form onsubmit={handleSubmit} class="space-y-5">
		<!-- Title -->
		<div class="space-y-1">
			<input
				type="text"
				id="title"
				placeholder="An interesting title..."
				bind:value={formData.title}
				class="w-full bg-transparent border-none text-xl font-bold tracking-tight placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 p-0 text-foreground transition-all focus:placeholder:text-muted-foreground/20 {errors.title ? 'border-b border-destructive/60 pb-1' : ''}"
			/>
			{#if errors.title}
				<p class="text-xs text-destructive mt-1 font-medium">{errors.title}</p>
			{/if}
		</div>

		<hr class="border-border/50" />

		<!-- Body -->
		<div class="space-y-2 relative">
			<textarea
				id="body"
				placeholder="What's on your mind? Write your post content..."
				bind:value={formData.body}
				maxlength="5000"
				rows={8}
				class="w-full bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 min-h-[200px] text-foreground/90 resize-none transition-all focus:placeholder:text-muted-foreground/20 pb-8 animate-none rounded-xl transition-all duration-200 {errors.body ? 'border border-destructive bg-destructive/5 p-3' : 'border-none p-2'}"
			></textarea>
			{#if errors.body}
				<p class="text-xs text-destructive mt-1 font-medium">{errors.body}</p>
			{/if}
			
			<div class="flex justify-end text-xs text-muted-foreground/60 select-none pb-1">
				<span class={formData.body.length > 4500 ? 'text-amber-500 font-semibold' : ''}>
					{formData.body.length}
				</span>
				<span>/ 5000 characters</span>
			</div>
		</div>

		<!-- Cover Image Uploader -->
		<div class="pt-4 border-t border-border/40">
			<ImageUploader
				label="Add an image (Optional)"
				imageUrl={StorageService.getPublicUrl('post-assets', formData.image_key)}
				onImageUpload={(key) => (formData.image_key = key)}
				onImageRemove={() => (formData.image_key = null)}
				uploadHandler={(file) => StorageService.uploadAsset('post-assets', file).then(res => res.file_key)}
				aspectRatio="banner"
			/>
		</div>

		<!-- Settings and Toggles -->
		<div class="pt-4 border-t border-border/40 space-y-4">
			{#if mode === 'create' && !defaultCommunityId}
				<div class="space-y-2">
					<Label class="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
						Select Community
					</Label>
					<CommunitySelector {communities} bind:selectedId={formData.community_id} />
					{#if errors.community_id}
						<p class="text-xs text-destructive mt-1 font-medium">{errors.community_id}</p>
					{/if}
				</div>
			{/if}

			<!-- Toggle Options grid (2 columns on mobile/tablet) -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#if mode === 'create'}
					{@const selectedCommunity = communities.find((c) => c.id === formData.community_id) || (communityState.currentCommunity?.id === formData.community_id ? communityState.currentCommunity : null)}
					{#if selectedCommunity?.allow_anonymous}
						<label class="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-secondary/5 hover:bg-secondary/10 cursor-pointer transition-all duration-200 select-none">
							<input
								type="checkbox"
								id="anonymous"
								bind:checked={formData.is_anonymous}
								class="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40 focus:ring-offset-background"
							/>
							<div class="flex flex-col">
								<span class="text-xs font-semibold text-foreground">Post Anonymously</span>
							</div>
						</label>
					{/if}

					{#if selectedCommunity?.owner_id === user.id || communityState.isAdmin}
						<label class="flex items-center gap-3 p-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all duration-200 select-none">
							<input
								type="checkbox"
								id="announcement"
								bind:checked={formData.is_announcement}
								class="h-4 w-4 rounded border-primary/30 bg-background text-primary focus:ring-primary/40 focus:ring-offset-background"
							/>
							<div class="flex flex-col">
								<span class="text-xs font-bold text-primary flex items-center gap-1.5">
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
									</svg>
									Announcement
								</span>
							</div>
						</label>
					{/if}
				{:else if post}
					{#if communityState.isAdmin || communityState.isOwner}
						<label class="flex items-center gap-3 p-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all duration-200 select-none">
							<input
								type="checkbox"
								id="announcement-edit"
								bind:checked={formData.is_announcement}
								class="h-4 w-4 rounded border-primary/30 bg-background text-primary focus:ring-primary/40 focus:ring-offset-background"
							/>
							<div class="flex flex-col">
								<span class="text-xs font-bold text-primary flex items-center gap-1.5">
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
									</svg>
									Announcement
								</span>
							</div>
						</label>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex justify-end gap-3 pt-4 border-t border-border/40">
			<Button 
				variant="outline" 
				type="button" 
				onclick={() => onSuccess ? onSuccess() : history.back()}
				class="border-border/80 text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/20 rounded-xl px-4 py-2 font-semibold"
			>
				Cancel
			</Button>
			<Button
				type="submit"
				disabled={isSubmitting || (mode === 'create' && communities.length === 0 && !defaultCommunityId)}
				class="bg-primary font-bold px-5 py-2 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/95 transition-all active:scale-[0.98] rounded-xl flex items-center justify-center gap-2"
			>
				{#if isSubmitting}
					<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
					<span>Publishing...</span>
				{:else}
					<span>{mode === 'create' ? 'Publish Post' : 'Save Changes'}</span>
				{/if}
			</Button>
		</div>
	</form>
{:else}
	<!-- Default Spacious Layout (2 Columns on Desktop) -->
	<form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
		<!-- Editor Area (Left 2 columns on Desktop) -->
		<div class="lg:col-span-2 space-y-6 bg-card border border-border/60 p-6 md:p-8 rounded-2xl shadow-sm">
			<!-- Title Field (Medium/Notion-Style distraction-free borderless) -->
			<div class="space-y-1">
				<input
					type="text"
					id="title"
					placeholder="An interesting title..."
					bind:value={formData.title}
					class="w-full bg-transparent border-none text-2xl md:text-3xl font-extrabold tracking-tight placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 p-0 text-foreground transition-all focus:placeholder:text-muted-foreground/20 {errors.title ? 'border-b border-destructive/60 pb-1' : ''}"
				/>
				{#if errors.title}
					<p class="text-xs text-destructive mt-1 font-medium">{errors.title}</p>
				{/if}
			</div>

			<hr class="border-border/50" />

			<!-- Body Field (Borderless distraction-free typing area) -->
			<div class="space-y-2 relative">
				<textarea
					id="body"
					placeholder="What's on your mind? Write your post content here..."
					bind:value={formData.body}
					maxlength="5000"
					rows={12}
					class="w-full bg-transparent text-base md:text-lg leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 min-h-[300px] text-foreground/90 resize-none transition-all focus:placeholder:text-muted-foreground/20 pb-8 rounded-2xl transition-all duration-200 {errors.body ? 'border border-destructive bg-destructive/5 p-3' : 'border-none p-2'}"
				></textarea>
				{#if errors.body}
					<p class="text-xs text-destructive mt-1 font-medium">{errors.body}</p>
				{/if}
				
				<div class="flex justify-end text-xs text-muted-foreground/60 select-none pb-2">
					<span class={formData.body.length > 4500 ? 'text-amber-500 font-semibold' : ''}>
						{formData.body.length}
					</span>
					<span>/ 5000 characters</span>
				</div>
			</div>

			<!-- Cover Image Upload Area -->
			<div class="pt-6 border-t border-border/40">
				<ImageUploader
					label="Add an image (Optional)"
					imageUrl={StorageService.getPublicUrl('post-assets', formData.image_key)}
					onImageUpload={(key) => (formData.image_key = key)}
					onImageRemove={() => (formData.image_key = null)}
					uploadHandler={(file) => StorageService.uploadAsset('post-assets', file).then(res => res.file_key)}
					aspectRatio="banner"
				/>
			</div>
		</div>

		<!-- Publishing Settings Sidebar (Right 1 column on Desktop) -->
		<div class="space-y-6 lg:sticky lg:top-24">
			<div class="bg-card border border-border/60 p-6 rounded-2xl shadow-sm space-y-6">
				<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 pb-3">
					Publishing Settings
				</h3>

				<!-- Community Selector (Only on create mode) -->
				{#if mode === 'create' && !defaultCommunityId}
					<div class="space-y-2">
						<Label class="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
							Select Community
						</Label>
						<CommunitySelector {communities} bind:selectedId={formData.community_id} />
						{#if errors.community_id}
							<p class="text-xs text-destructive mt-1 font-medium">{errors.community_id}</p>
						{/if}
						{#if communities.length === 0}
							<p class="text-xs text-destructive mt-1 font-medium">You are not a member of any communities yet.</p>
						{/if}
					</div>
				{/if}

				<!-- Toggle Options (Anonymous / Announcements) -->
				<div class="space-y-3">
					<Label class="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block">
						Post Options
					</Label>
					
					<div class="space-y-3">
						{#if mode === 'create'}
							{@const selectedCommunity = communities.find((c) => c.id === formData.community_id) || (communityState.currentCommunity?.id === formData.community_id ? communityState.currentCommunity : null)}
							{#if selectedCommunity?.allow_anonymous}
								<label class="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/5 hover:bg-secondary/10 cursor-pointer transition-all duration-250 select-none">
									<input
										type="checkbox"
										id="anonymous"
										bind:checked={formData.is_anonymous}
										class="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/40 focus:ring-offset-background"
									/>
									<div class="flex flex-col">
										<span class="text-sm font-semibold text-foreground">Post Anonymously</span>
										<span class="text-xs text-muted-foreground/80">Hide your profile from others</span>
									</div>
								</label>
							{/if}

							{#if selectedCommunity?.owner_id === user.id || communityState.isAdmin}
								<label class="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all duration-250 select-none">
									<input
										type="checkbox"
										id="announcement"
										bind:checked={formData.is_announcement}
										class="h-4 w-4 rounded border-primary/30 bg-background text-primary focus:ring-primary/40 focus:ring-offset-background"
									/>
									<div class="flex flex-col">
										<span class="text-sm font-bold text-primary flex items-center gap-1.5">
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
												<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
											</svg>
											Announcement
										</span>
										<span class="text-xs text-primary/70">Pin to the top of the community</span>
									</div>
								</label>
							{/if}
						{:else if post}
							{#if communityState.isAdmin || communityState.isOwner}
								<label class="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all duration-250 select-none">
									<input
										type="checkbox"
										id="announcement-edit"
										bind:checked={formData.is_announcement}
										class="h-4 w-4 rounded border-primary/30 bg-background text-primary focus:ring-primary/40 focus:ring-offset-background"
									/>
									<div class="flex flex-col">
										<span class="text-sm font-bold text-primary flex items-center gap-1.5">
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
												<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
											</svg>
											Announcement
										</span>
										<span class="text-xs text-primary/70">Pin to the top of the community</span>
									</div>
								</label>
							{/if}
						{/if}
					</div>
				</div>

				<!-- Publishing Action Buttons -->
				<div class="flex flex-col gap-3 pt-4 border-t border-border/40">
					<Button
						type="submit"
						disabled={isSubmitting || (mode === 'create' && communities.length === 0 && !defaultCommunityId)}
						class="w-full bg-primary font-bold py-2.5 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/95 transition-all active:scale-[0.98] rounded-xl flex items-center justify-center gap-2"
					>
						{#if isSubmitting}
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
							<span>{mode === 'create' ? 'Publishing...' : 'Saving...'}</span>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
							</svg>
							<span>{mode === 'create' ? 'Publish Post' : 'Save Changes'}</span>
						{/if}
					</Button>
					
					<Button 
						variant="outline" 
						type="button" 
						onclick={() => onSuccess ? onSuccess() : history.back()}
						class="w-full border-border/80 text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/20 rounded-xl py-2.5 font-semibold"
					>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	</form>
{/if}
