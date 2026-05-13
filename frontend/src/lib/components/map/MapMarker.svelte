<script lang="ts">
	let { shortName, color } = $props<{
		shortName: string;
		color: string;
	}>();
</script>

<div
	class="flex h-9 w-9 -rotate-45 items-center justify-center rounded-t-full rounded-br-full shadow-lg transition-transform duration-200 hover:scale-115 hover:shadow-primary/50"
	style="background: {color}"
>
	<span class="rotate-45 text-[11px] font-extrabold tracking-tighter text-white">
		{shortName}
	</span>
</div>
