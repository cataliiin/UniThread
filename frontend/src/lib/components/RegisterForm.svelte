<script lang="ts">
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Loader2, AlertCircle, Eye, EyeOff } from '@lucide/svelte';
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
		class="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40"
	>
		<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
	</div>
	<h1 class="text-2xl font-bold text-foreground">Create UniThread Account</h1>
	<p class="text-muted-foreground">Join the community</p>
</div>

<form class="space-y-4" onsubmit={handleSubmit} novalidate>
	<div class="space-y-2">
		<Label for="email" class="text-muted-foreground">Email</Label>
		<Input
			type="email"
			id="email"
			bind:value={email}
			onblur={() => (touched.email = true)}
			class="transition-all duration-300 {emailError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
			placeholder="name.surname@student.unitbv.ro"
		/>
		{#if emailError}
			<p class="flex items-center gap-1 text-xs text-destructive">
				<AlertCircle class="h-3.5 w-3.5 shrink-0" />
				{emailError}
			</p>
		{/if}
	</div>
	<div class="space-y-2">
		<Label for="name" class="text-muted-foreground">First Name</Label>
		<Input
			type="text"
			id="name"
			bind:value={name}
			onblur={() => (touched.name = true)}
			class="transition-all duration-300 {nameError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
			placeholder="First Name"
		/>
		{#if nameError}
			<p class="flex items-center gap-1 text-xs text-destructive">
				<AlertCircle class="h-3.5 w-3.5 shrink-0" />
				{nameError}
			</p>
		{/if}
	</div>
	<div class="space-y-2">
		<Label for="surname" class="text-muted-foreground">Last Name</Label>
		<Input
			type="text"
			id="surname"
			bind:value={surname}
			onblur={() => (touched.surname = true)}
			class="transition-all duration-300 {surnameError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
			placeholder="Last Name"
		/>
		{#if surnameError}
			<p class="flex items-center gap-1 text-xs text-destructive">
				<AlertCircle class="h-3.5 w-3.5 shrink-0" />
				{surnameError}
			</p>
		{/if}
	</div>
	<div class="space-y-2">
		<Label for="username" class="text-muted-foreground">Username</Label>
		<Input
			type="text"
			id="username"
			bind:value={username}
			onblur={() => (touched.username = true)}
			class="transition-all duration-300 {usernameError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
			placeholder="Choose a username"
		/>
		{#if usernameError}
			<p class="flex items-center gap-1 text-xs text-destructive">
				<AlertCircle class="h-3.5 w-3.5 shrink-0" />
				{usernameError}
			</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="password" class="text-muted-foreground">Password</Label>
		<div class="relative">
			<Input
				type={showPassword ? 'text' : 'password'}
				id="password"
				bind:value={password}
				onblur={() => (touched.password = true)}
				class="pr-10 transition-all duration-300 {passwordError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
				placeholder="Password must be at least 8 characters"
			/>
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors duration-300 hover:text-foreground"
			>
				{#if showPassword}
					<EyeOff class="h-5 w-5" />
				{:else}
					<Eye class="h-5 w-5" />
				{/if}
			</button>
		</div>
		{#if passwordError}
			<p class="flex items-center gap-1 text-xs text-destructive">
				<AlertCircle class="h-3.5 w-3.5 shrink-0" />
				{passwordError}
			</p>
		{/if}
	</div>

	<div class="space-y-2">
		<Label for="confirmPassword" class="text-muted-foreground">Confirm Password</Label>
		<div class="relative">
			<Input
				type={showConfirmPassword ? 'text' : 'password'}
				id="confirmPassword"
				bind:value={confirmPassword}
				onblur={() => (touched.confirmPassword = true)}
				class="pr-10 transition-all duration-300 {confirmPasswordError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
				placeholder="Passwords must match"
			/>
			<button
				type="button"
				onclick={() => (showConfirmPassword = !showConfirmPassword)}
				class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors duration-300 hover:text-foreground"
			>
				{#if showConfirmPassword}
					<EyeOff class="h-5 w-5" />
				{:else}
					<Eye class="h-5 w-5" />
				{/if}
			</button>
		</div>
		{#if confirmPasswordError}
			<p class="flex items-center gap-1 text-xs text-destructive">
				<AlertCircle class="h-3.5 w-3.5 shrink-0" />
				{confirmPasswordError}
			</p>
		{/if}
	</div>

	<Button
		type="submit"
		disabled={isLoading}
		class="w-full bg-primary py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98]"
	>
		{#if isLoading}
			<span class="flex items-center justify-center gap-2">
				<Loader2 class="h-4 w-4 animate-spin" />
				Creating Account...
			</span>
		{:else}
			Sign Up
		{/if}
	</Button>
</form>

<p class="mt-6 text-center text-sm text-muted-foreground">
	Already have an account?
	<a href="/login" class="font-semibold text-primary transition-all duration-300 hover:text-primary/80 hover:underline">
		Sign In
	</a>
</p>
