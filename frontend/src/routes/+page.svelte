<script lang="ts">
	import { user } from '$lib/stores/user.svelte';
	let avatarUrl = $derived(user.avatarUrl);
</script>

<div class="mx-auto max-w-[1200px] p-8">
	<header class="mb-12 flex items-center justify-between">
		<div class="welcome-text">
			<h1 class="m-0 text-3xl font-extrabold text-slate-900">Main Page</h1>
			<p class="mt-1 text-slate-500">Welcome to UniThread!</p>
		</div>

		<a
			href="/profile"
			class="no-underline transition-transform duration-200 hover:scale-105"
			title="View Profile"
		>
			<div
				class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-base font-bold text-white shadow-[0_10px_15px_-3px_rgba(79,70,229,0.2)]"
			>
				{#if avatarUrl}
					<img
						src={avatarUrl}
						alt="Avatar"
						class="h-full w-full [transform:translateZ(0)] object-cover [backface-visibility:hidden]"
					/>
				{:else}
					{user.avatarInitials}
				{/if}
			</div>
		</a>
	</header>

	<section class="grid gap-8">
		<div
			class="flex items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-white p-16 font-medium text-slate-400"
		>
			<p>The main content of the page will appear here soon.</p>
		</div>
	</section>
</div>
