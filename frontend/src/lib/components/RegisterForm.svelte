<script lang="ts">
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let isLoading = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!email || !username || !password || !confirmPassword) {
			toasts.show('Please fill in all fields', 'error');
			return;
		}

		if (!email.endsWith('@student.unitbv.ro') && !email.endsWith('@unitbv.ro')) {
			toasts.show('Email must be a student or staff email from unitbv.ro', 'error');
			return;
		}

		if (password.length < 8) {
			toasts.show('Password must be at least 8 characters long', 'error');
			return;
		}

		if (password !== confirmPassword) {
			toasts.show('Passwords do not match', 'error');
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

			await user.register(email, username);

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
	<h1 class="text-2xl font-bold text-white">Create UniThread Account</h1>
	<p class="text-slate-400">Join the community</p>
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
		<label for="username" class="mb-1 block text-sm font-medium text-slate-300">Username</label>
		<input
			type="text"
			id="username"
			bind:value={username}
			class="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
			placeholder="Choose a username"
		/>
	</div>

	<div>
		<label for="password" class="mb-1 block text-sm font-medium text-slate-300">Password</label>
		<div class="relative">
			<input
				type={showPassword ? 'text' : 'password'}
				id="password"
				bind:value={password}
				class="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
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
				class="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
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
