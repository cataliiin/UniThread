<script lang="ts">
	let { message = 'The main content of the page will appear here soon.' } = $props<{
		message?: string;
	}>();
</script>

<section class="grid gap-8">
	<div
		class="flex items-center justify-center rounded-[24px] border-2 border-dashed border-border bg-muted/50 p-16 text-center font-medium text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-muted hover:text-foreground"
	>
		<p>{message}</p>
	</div>
</section>
