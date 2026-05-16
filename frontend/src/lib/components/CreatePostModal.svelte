<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import PostForm from './PostForm.svelte';
	import { Plus } from 'lucide-svelte';

	interface Props {
		communityId?: string | null;
		communities?: any[];
		open?: boolean;
		onSuccess?: () => void;
	}

	let { communityId = null, communities = [], open = $bindable(false), onSuccess }: Props = $props();

	function handleSuccess() {
		open = false;
		onSuccess?.();
	}
</script>

<Dialog.Root bind:open>
<Dialog.Content class="sm:max-w-[600px] w-[calc(100%-2rem)] max-w-full rounded-2xl border border-border bg-card shadow-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-bold">Create a Post</Dialog.Title>
			<Dialog.Description>
				Share something with the community.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="py-4">
			<PostForm 
				mode="create" 
				{communities} 
				defaultCommunityId={communityId} 
				onSuccess={handleSuccess}
				layout="compact"
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>
