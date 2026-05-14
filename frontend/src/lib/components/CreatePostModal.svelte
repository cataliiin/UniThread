<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import PostForm from './PostForm.svelte';
	import { Plus } from 'lucide-svelte';

	interface Props {
		communityId?: string | null;
		communities?: any[];
		open?: boolean;
	}

	let { communityId = null, communities = [], open = $bindable(false) }: Props = $props();

	function handleSuccess() {
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>
