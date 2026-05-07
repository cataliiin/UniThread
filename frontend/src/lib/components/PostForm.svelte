<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { toast } from '$lib/stores/toast.svelte';
	import { PostsService } from '$lib/api/services';
	import type { Post } from '$lib/types/post';

	interface Props {
		post?: Post | null;
		communities?: any[];
		mode: 'create' | 'edit';
	}

	let { post = null, communities = [], mode }: Props = $props();

	// Form state
	let formData = $state({
		title: '',
		content: '',
		community_id: '',
		is_anonymous: false
	});

	let isSubmitting = $state(false);

	// Sync formData when post prop changes (for edit mode)
	$effect(() => {
		if (post) {
			formData.title = post.title;
			formData.content = post.content;
			// Since post.community is not an ID but an object (in the feed), we skip it for edit since we can't change it
		} else if (communities.length > 0 && !formData.community_id) {
			formData.community_id = communities[0].id; // Default to first
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (
			!formData.title.trim() ||
			!formData.content.trim() ||
			(mode === 'create' && !formData.community_id)
		) {
			toast.error('Title, content, and community are required.');
			return;
		}

		isSubmitting = true;

		try {
			if (mode === 'create') {
				const result = await PostsService.createPost({
					title: formData.title.trim(),
					body: formData.content.trim(),
					community_id: formData.community_id,
					is_anonymous: formData.is_anonymous
				});
				toast.success('Post created successfully!');
				goto(`/communities/${formData.community_id}`);
			} else if (post) {
				const result = await PostsService.updatePost(post.id.toString(), {
					title: formData.title.trim(),
					body: formData.content.trim()
				});
				toast.success('Post updated successfully!');
				goto(`/posts/${post.id}`);
			}
		} catch (e: any) {
			toast.error(e.message || `Could not ${mode} post.`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	{#if mode === 'create'}
		<div class="space-y-2">
			<Label for="community">Community</Label>
			<select
				id="community"
				bind:value={formData.community_id}
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				disabled={communities.length === 0}
			>
				<option value="" disabled>Select a community</option>
				{#each communities as community}
					<option value={community.id}>{community.name}</option>
				{/each}
			</select>
			{#if communities.length === 0}
				<p class="text-xs text-muted-foreground">You are not a member of any communities yet.</p>
			{/if}
		</div>
	{/if}

	<div class="space-y-2">
		<Label for="title">Title</Label>
		<Input id="title" placeholder="An interesting title" bind:value={formData.title} required />
	</div>

	<div class="space-y-2">
		<Label for="content">Content</Label>
		<Textarea
			id="content"
			placeholder="What are your thoughts?"
			bind:value={formData.content}
			rows={8}
			required
		/>
	</div>

	{#if mode === 'create' && communities.find((c) => c.id === formData.community_id)?.allow_anonymous}
		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				id="anonymous"
				bind:checked={formData.is_anonymous}
				class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
			/>
			<Label for="anonymous" class="font-normal">Post anonymously</Label>
		</div>
	{/if}

	<div class="flex justify-end space-x-4 border-t pt-4">
		<Button variant="outline" type="button" onclick={() => history.back()}>Cancel</Button>
		<Button
			type="submit"
			disabled={isSubmitting || (mode === 'create' && communities.length === 0)}
		>
			{isSubmitting
				? mode === 'create'
					? 'Posting...'
					: 'Saving...'
				: mode === 'create'
					? 'Post'
					: 'Save Changes'}
		</Button>
	</div>
</form>
