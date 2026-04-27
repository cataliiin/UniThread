<script lang="ts">
	import { user } from '$lib/stores/user.svelte';
	let avatarUrl = $derived(user.avatarUrl);
</script>

<div class="p-8 max-w-[1200px] mx-auto">
	<header class="flex justify-between items-center mb-12">
		<div class="welcome-text">
			<h1 class="text-3xl font-extrabold text-slate-900 m-0">Main Page</h1>
			<p class="text-slate-500 mt-1">Welcome to UniThread!</p>
		</div>
		
		<a href="/profile" class="no-underline transition-transform duration-200 hover:scale-105" title="View Profile">
			<div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-[0_10px_15px_-3px_rgba(79,70,229,0.2)] overflow-hidden">
				{#if avatarUrl}
					<img src={avatarUrl} alt="Avatar" class="w-full h-full object-cover [transform:translateZ(0)] [backface-visibility:hidden]" />
				{:else}
					{user.avatarInitials}
				{/if}
			</div>
		</a>
	</header>

	<section class="grid gap-8">
		<div class="p-16 bg-white rounded-[24px] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-medium">
			<p>The main content of the page will appear here soon.</p>
		</div>
	</section>
</div>
