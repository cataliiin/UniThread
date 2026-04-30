<script lang="ts">
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import logo from '$lib/assets/UniThread_Logo.svg';

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);
	let touched = $state({ email: false, password: false });

	const VALID_DOMAIN = '@student.unitbv.ro';

	const emailError = $derived.by(() => {
		if (!touched.email) return '';
		if (!email) return 'Email is required.';
		if (!email.endsWith(VALID_DOMAIN))
			return `Must be a ${VALID_DOMAIN} address.`;
		return '';
	});

	const passwordError = $derived.by(() => {
		if (!touched.password) return '';
		if (!password) return 'Password is required.';
		if (password.length < 8) return 'Password must be at least 8 characters.';
		return '';
	});

	const isFormValid = $derived(!emailError && !passwordError && !!email && !!password);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		touched.email = true;
		touched.password = true;

		if (!isFormValid) {
			toasts.show('Please fix the errors before submitting.', 'error');
			return;
		}

		isSubmitting = true;
		try {
			const result = await user.login(email, password);

			if (!result.success) {
				toasts.show(result.error ?? 'Login failed. Please try again.', 'error');
				return;
			}

			toasts.show('Welcome back! Logging you in…', 'success');
			setTimeout(() => goto('/'), 1000);
		} catch {
			toasts.show('An unexpected error occurred. Please try again.', 'error');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="mb-8 flex flex-col items-center">
	<div
		class="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-indigo-500/20"
	>
		<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
	</div>
	<h1 class="text-2xl font-bold text-white">Login to UniThread</h1>
	<p class="text-slate-400">Enter your credentials to continue</p>
</div>

<form class="space-y-5" onsubmit={handleSubmit} novalidate>
	<!-- Email -->
	<div>
		<label for="login-email" class="mb-1 block text-sm font-medium text-slate-300">Email</label>
		<input
			type="email"
			id="login-email"
			bind:value={email}
			onblur={() => (touched.email = true)}
			class="w-full rounded-xl border px-4 py-3 text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500
			{emailError
				? 'border-red-500 bg-red-950/40 focus:border-transparent'
				: 'border-slate-700 bg-slate-800 focus:border-transparent'}"
			placeholder="name.surname@student.unitbv.ro"
		/>
		{#if emailError}
			<p class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
				{emailError}
			</p>
		{/if}
	</div>

	<!-- Password -->
	<div>
		<label for="login-password" class="mb-1 block text-sm font-medium text-slate-300">Password</label>
		<input
			type="password"
			id="login-password"
			bind:value={password}
			onblur={() => (touched.password = true)}
			class="w-full rounded-xl border px-4 py-3 text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500
			{passwordError
				? 'border-red-500 bg-red-950/40 focus:border-transparent'
				: 'border-slate-700 bg-slate-800 focus:border-transparent'}"
			placeholder="••••••••"
		/>
		{#if passwordError}
			<p class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
				{passwordError}
			</p>
		{/if}
	</div>

	<!-- Submit -->
	<button
		type="submit"
		disabled={isSubmitting}
		class="w-full transform rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
	>
		{#if isSubmitting}
			<span class="flex items-center justify-center gap-2">
				<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				Signing In…
			</span>
		{:else}
			Sign In
		{/if}
	</button>
</form>

<p class="mt-6 text-center text-sm text-slate-400">
	Don't have an account?
	<a href="/register" class="font-semibold text-indigo-400 transition-colors hover:text-indigo-300">
		Sign Up
	</a>
</p>
