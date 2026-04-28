<script lang="ts">
	import { toasts } from '$lib/stores/toast.svelte';

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!email || !password) {
			toasts.show('Please fill in all fields', 'error');
			return;
		}

		isSubmitting = true;
		// Simulate API call
		setTimeout(() => {
			toasts.show('Successfully logged in!', 'success');
			isSubmitting = false;
			// Redirect or update app state here
		}, 1000);
	}
</script>

<section class="flex h-screen items-center justify-center bg-slate-950">
	<div class="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
		<div class="mb-8 flex flex-col items-center">
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg
				>
			</div>
			<h1 class="text-2xl font-bold text-white">Login to UniThread</h1>
			<p class="text-slate-400">Enter your credentials to continue</p>
		</div>

		<form class="space-y-4" onsubmit={handleSubmit}>
			<div>
				<label for="email" class="mb-1 block text-sm font-medium text-slate-300">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					class="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
					placeholder="name.surname@student.unitbv.ro"
				/>
			</div>
			<div>
				<label for="password" class="mb-1 block text-sm font-medium text-slate-300">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
					placeholder="••••••••"
				/>
			</div>
			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full transform rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isSubmitting ? 'Signing In...' : 'Sign In'}
			</button>
		</form>
	</div>
</section>
