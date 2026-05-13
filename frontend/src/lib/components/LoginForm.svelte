<script lang="ts">
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Loader2, AlertCircle } from '@lucide/svelte';
	import logo from '$lib/assets/UniThread_Logo.svg';

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);
	let touched = $state({ email: false, password: false });

	const VALID_DOMAIN = '@student.unitbv.ro';

	const emailError = $derived.by(() => {
		if (!touched.email) return '';
		if (!email) return 'Email is required.';
		if (!email.endsWith(VALID_DOMAIN)) return `Must be a ${VALID_DOMAIN} address.`;
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
		class="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40"
	>
		<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
	</div>
	<h1 class="text-2xl font-bold text-foreground">Login to UniThread</h1>
	<p class="text-muted-foreground">Enter your credentials to continue</p>
</div>

<form class="space-y-5" onsubmit={handleSubmit} novalidate>
	<!-- Email -->
	<div class="space-y-2">
		<Label for="login-email" class="text-muted-foreground">Email</Label>
		<Input
			type="email"
			id="login-email"
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

	<!-- Password -->
	<div class="space-y-2">
		<Label for="login-password" class="text-muted-foreground">Password</Label>
		<Input
			type="password"
			id="login-password"
			bind:value={password}
			onblur={() => (touched.password = true)}
			class="transition-all duration-300 {passwordError ? 'border-destructive focus-visible:ring-destructive/20' : ''}"
			placeholder="••••••••"
		/>
		{#if passwordError}
			<p class="flex items-center gap-1 text-xs text-destructive">
				<AlertCircle class="h-3.5 w-3.5 shrink-0" />
				{passwordError}
			</p>
		{/if}
	</div>

	<!-- Submit -->
	<Button
		type="submit"
		disabled={isSubmitting}
		class="w-full bg-primary py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98]"
	>
		{#if isSubmitting}
			<span class="flex items-center justify-center gap-2">
				<Loader2 class="h-4 w-4 animate-spin" />
				Signing In...
			</span>
		{:else}
			Sign In
		{/if}
	</Button>
</form>

<p class="mt-6 text-center text-sm text-muted-foreground">
	Don't have an account?
	<a href="/register" class="font-semibold text-primary transition-all duration-300 hover:text-primary/80 hover:underline">
		Sign Up
	</a>
</p>
