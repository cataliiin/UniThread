<script lang="ts">
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import logo from '$lib/assets/UniThread_Logo.svg';

	let email = $state('');
	let username = $state('');
	let password = $state('');
    let name = $state('');
    let surname = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let isLoading = $state(false);
	let touched = $state({ email: false, username: false, password: false, confirmPassword: false , name: false , surname: false });

	const VALID_DOMAIN = '@student.unitbv.ro';

	const emailError = $derived.by(() => {
		if (!touched.email) return '';
		if (!email) return 'Email is required.';
		if (!email.endsWith(VALID_DOMAIN)) return `Must be a ${VALID_DOMAIN} address.`;
		return '';
	});

	const usernameError = $derived.by(() => {
		if (!touched.username) return '';
		if (!username) return 'Username is required.';
		if (username.length < 3) return 'Username must be at least 3 characters.';
		return '';
	});

	const passwordError = $derived.by(() => {
		if (!touched.password) return '';
		if (!password) return 'Password is required.';
		if (password.length < 8) return 'Password must be at least 8 characters.';
		return '';
	});

	const confirmPasswordError = $derived.by(() => {
		if (!touched.confirmPassword) return '';
		if (confirmPassword !== password) return 'Passwords do not match.';
		return '';
	});

    const nameError = $derived.by(() => {
        if (!touched.name) return '';
        if (!name) return 'First name is required.';
        return '';
    });

    const surnameError = $derived.by(() => {
        if (!touched.surname) return '';
        if (!surname) return 'Last name is required.';
        return '';
    });

	const isFormValid = $derived(
		!emailError && !usernameError && !passwordError && !confirmPasswordError && !nameError && !surnameError &&
		!!email && !!username && !!password && !!confirmPassword && !!name && !!surname
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		touched.email = true;
		touched.username = true;
		touched.password = true;
		touched.confirmPassword = true;
		touched.name = true;
		touched.surname = true;

		if (!isFormValid) {
			toasts.show('Please fix the errors before submitting.', 'error');
			return;
		}

		isLoading = true;

		try {
			const isUsernameAvailable = await user.checkUsername(username);
			const isEmailAvailable = await user.checkEmail(email);

			if (!isEmailAvailable) {
				toasts.show('This email is already in use. Try logging in instead.', 'error');
				isLoading = false;
				return;
			}

			if (!isUsernameAvailable) {
				toasts.show('Username is taken. Please choose another one', 'error');
				isLoading = false;
				return;
			}

			await user.register(email, username, password, name, surname);

			toasts.show('Registration successful! Logging you in...', 'success');
			setTimeout(() => {
				goto('/');
			}, 1500);
		} catch (error) {
			toasts.show('An error occurred during registration.', 'error');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="mb-8 flex flex-col items-center">
	<div
		class="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-indigo-500/20"
	>
		<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
	</div>
	<h1 class="text-2xl font-bold text-white">Create UniThread Account</h1>
	<p class="text-slate-400">Join the community</p>
</div>

<form class="space-y-4" onsubmit={handleSubmit} novalidate>
	<div>
		<label for="email" class="mb-1 block text-sm font-medium text-slate-300">Email</label>
		<input
			type="email"
			id="email"
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
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line
						x1="12"
						x2="12.01"
						y1="16"
						y2="16"
					/></svg
				>
				{emailError}
			</p>
		{/if}
	</div>
<div>
        <label for="name" class="mb-1 block text-sm font-medium text-slate-300">First Name</label>
        <input
            type="text"
            id="name"
            bind:value={name}
            onblur={() => (touched.name = true)}
            class="w-full rounded-xl border px-4 py-3 text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500
            border-slate-700 bg-slate-800 focus:border-transparent
            {nameError 
                ? 'border-red-500 bg-red-950/40 focus:border-transparent'
				: 'border-slate-700 bg-slate-800 focus:border-transparent'}"
            placeholder="First Name"
        />
        {#if nameError}
            <p class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {nameError}
            </p>
        {/if}
    </div>
	<div>
		<label for="surname" class="mb-1 block text-sm font-medium text-slate-300">Last Name</label>
		<input
			type="text"
			id="surname"
			bind:value={surname}
			onblur={() => (touched.surname = true)}
			class="w-full rounded-xl border px-4 py-3 text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500
			{surnameError
				? 'border-red-500 bg-red-950/40 focus:border-transparent'
				: 'border-slate-700 bg-slate-800 focus:border-transparent'}"
			placeholder="Last Name"
		/>
		{#if surnameError}
			<p class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
				{surnameError}
			</p>
		{/if}
	</div>
	<div>
		<label for="username" class="mb-1 block text-sm font-medium text-slate-300">Username</label>
		<input
			type="text"
			id="username"
			bind:value={username}
			onblur={() => (touched.username = true)}
			class="w-full rounded-xl border px-4 py-3 text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500
			{usernameError
				? 'border-red-500 bg-red-950/40 focus:border-transparent'
				: 'border-slate-700 bg-slate-800 focus:border-transparent'}"
			placeholder="Choose a username"
		/>
		{#if usernameError}
			<p class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line
						x1="12"
						x2="12.01"
						y1="16"
						y2="16"
					/></svg
				>
				{usernameError}
			</p>
		{/if}
	</div>

	<div>
		<label for="password" class="mb-1 block text-sm font-medium text-slate-300">Password</label>
		<div class="relative">
			<input
				type={showPassword ? 'text' : 'password'}
				id="password"
				bind:value={password}
				onblur={() => (touched.password = true)}
				class="w-full rounded-xl border px-4 py-3 text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500
				{passwordError
					? 'border-red-500 bg-red-950/40 focus:border-transparent'
					: 'border-slate-700 bg-slate-800 focus:border-transparent'}"
				placeholder="Password must be at least 8 characters"
			/>
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
			>
				{#if showPassword}
					<svg
						class="h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
						/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path
							d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
						/><path d="m2 2 20 20" /></svg
					>
				{:else}
					<svg
						class="h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
						/><circle cx="12" cy="12" r="3" /></svg
					>
				{/if}
			</button>
		</div>
		{#if passwordError}
			<p class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line
						x1="12"
						x2="12.01"
						y1="16"
						y2="16"
					/></svg
				>
				{passwordError}
			</p>
		{/if}
	</div>

	<div>
		<label for="confirmPassword" class="mb-1 block text-sm font-medium text-slate-300"
			>Confirm Password</label
		>
		<div class="relative">
			<input
				type={showConfirmPassword ? 'text' : 'password'}
				id="confirmPassword"
				bind:value={confirmPassword}
				onblur={() => (touched.confirmPassword = true)}
				class="w-full rounded-xl border px-4 py-3 text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500
				{confirmPasswordError
					? 'border-red-500 bg-red-950/40 focus:border-transparent'
					: 'border-slate-700 bg-slate-800 focus:border-transparent'}"
				placeholder="Passwords must match"
			/>
			<button
				type="button"
				onclick={() => (showConfirmPassword = !showConfirmPassword)}
				class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-300"
			>
				{#if showConfirmPassword}
					<svg
						class="h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
						/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path
							d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
						/><path d="m2 2 20 20" /></svg
					>
				{:else}
					<svg
						class="h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path
							d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
						/><circle cx="12" cy="12" r="3" /></svg
					>
				{/if}
			</button>
		</div>
		{#if confirmPasswordError}
			<p class="mt-1.5 flex items-center gap-1 text-xs text-red-400">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line
						x1="12"
						x2="12.01"
						y1="16"
						y2="16"
					/></svg
				>
				{confirmPasswordError}
			</p>
		{/if}
	</div>

	<button
		type="submit"
		disabled={isLoading}
		class="w-full transform rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
	>
		{isLoading ? 'Creating Account...' : 'Sign Up'}
	</button>
</form>

<p class="mt-6 text-center text-sm text-slate-400">
	Already have an account?
	<a href="/login" class="font-semibold text-indigo-400 transition-colors hover:text-indigo-300">
		Sign In
	</a>
</p>
