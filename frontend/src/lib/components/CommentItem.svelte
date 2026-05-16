<script lang="ts">
	import type { CommentResponse } from '$lib/api/services/CommentsService';
	import { user } from '$lib/stores/user.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Trash2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getAuthorDisplayName } from '$lib/utils/user';
	import UserAvatar from './UserAvatar.svelte';
	import { StorageService } from '$lib/api/services';

	let { 
		comment, 
		onDelete 
	}: { 
		comment: CommentResponse; 
		onDelete?: (id: string) => void 
	} = $props();

	function formatTimeAgo(dateString: string): string {
		if (!dateString.endsWith('Z') && !dateString.includes('+')) {
			dateString += 'Z';
		}
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${diffDays}d ago`;
	}

	const isAuthor = $derived(user?.id === comment.author_id);
	// We could also check if user is community admin here if we pass community context
</script>

<div class="group flex gap-3 px-3 py-4 border-b border-border/40 last:border-0 transition-all duration-300 {isAuthor ? 'bg-primary/5 rounded-xl border-none my-1 shadow-sm' : ''}">
	<!-- Avatar -->
	{#if !comment.author}
		<UserAvatar initials="A" className="h-8 w-8 text-xs" />
	{:else}
		<button 
			class="flex shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
			onclick={() => comment.author_id && goto(`/profile/${comment.author_id}`)}
			title={`View ${getAuthorDisplayName(comment.author)}'s profile`}
		>
			<UserAvatar
				src={comment.author.avatar_key ? StorageService.getPublicUrl('user-assets', comment.author.avatar_key) : null}
				initials={getAuthorDisplayName(comment.author).charAt(0)}
				className="h-8 w-8 text-xs"
			/>
		</button>
	{/if}

	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between gap-2 mb-1">
			<div class="flex items-center gap-2 overflow-hidden">
				<button 
					class="text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
					onclick={() => comment.author_id && goto(`/profile/${comment.author_id}`)}
				>
					{getAuthorDisplayName(comment.author)}
				</button>

				{#if comment.author}
					<span class="text-xs text-muted-foreground/60">@{comment.author.username}</span>
				{/if}

				<span class="text-xs text-muted-foreground/60">{formatTimeAgo(comment.created_at)}</span>
			</div>

			{#if isAuthor}
				<button
					class="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground transition-all hover:text-destructive"
					onclick={() => onDelete && onDelete(comment.id)}
					title="Delete comment"
				>
					<Trash2 class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
		<p class="text-sm leading-relaxed text-card-foreground/90 whitespace-pre-wrap">{comment.body}</p>
	</div>
</div>
