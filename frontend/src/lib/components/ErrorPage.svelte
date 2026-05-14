<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	interface Action {
		label: string;
		href?: string;
		onClick?: () => void;
		variant?: 'default' | 'secondary' | 'destructive' | 'ghost' | 'link';
	}

	let {
		status = 404,
		title = 'Page Not Found',
		message = 'Sorry, the page you are looking for does not exist or has been moved. Check the URL or go back to the homepage.',
		illustration = '404',
		actions = [] as Action[]
	} = $props();

	function handleActionClick(action: Action) {
		if (action.onClick) {
			action.onClick();
		} else if (action.href) {
			goto(action.href);
		}
	}
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
	<div class="mb-2 text-6xl font-bold text-primary">{status}</div>
	<h1 class="mb-4 text-center text-2xl font-bold text-foreground">{title}</h1>
	<p class="mb-8 max-w-md text-center text-muted-foreground">{message}</p>

	<div class="flex flex-wrap justify-center gap-3">
		{#each actions as action}
			<button
				onclick={() => handleActionClick(action)}
				class="rounded-lg px-6 py-3 font-medium transition-all {action.variant === 'secondary'
					? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
					: 'bg-primary text-primary-foreground hover:bg-primary/90'}"
			>
				{action.label}
			</button>
		{/each}
	</div>
</div>
