<script lang="ts">
	let { message = 'The main content of the page will appear here soon.' } = $props<{
		message?: string;
	}>();
</script>

<section class="grid gap-8">
	<div
		class="flex items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-white/50 p-16 text-center font-medium text-slate-400 backdrop-blur-sm transition-colors hover:border-slate-300 hover:bg-white"
	>
		<p>{message}</p>
	</div>
</section>
