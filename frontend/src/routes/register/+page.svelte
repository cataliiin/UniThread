<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, slide } from 'svelte/transition';

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);

	let isLoading = $state(false);
	let errorToast = $state('');
	let successToast = $state('');

	function showError(msg: string) {
		errorToast = msg;
		setTimeout(() => {
			errorToast = '';
		}, 4000);
	}

	function showSuccess(msg: string) {
		successToast = msg;
		setTimeout(() => {
			successToast = '';
		}, 4000);
	}

	async function checkUsername(username: string): Promise<boolean> {
		// Simulate API call to check username availability
		await new Promise((resolve) => setTimeout(resolve, 500));

		if(localStorage.getItem(username) === username){
			return false;
		}
		return true;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if(!email.endsWith('@student.unitbv.ro') && !email.endsWith('@unitbv.ro')){
			showError('Email must be a student or staff email from unitbv.ro');
			return;
		}
		
		if (password.length < 8) {
			showError('Password must be at least 8 characters long.');
			return;
		}

		if (password !== confirmPassword) {
			showError('Passwords do not match.');
			return;
		}

		if (!email || !username) {
			showError('Please fill in all fields.');
			return;
		}

		const isUsernameAvailable = await checkUsername(username);
		if (!isUsernameAvailable) {
			showError('Username is taken. Please choose another one.');
			return;
		}
		localStorage.setItem(username, username);

		isLoading = true;
		errorToast = '';

		// Simulate API call. Add connection to backend here.
		await new Promise((resolve) => setTimeout(resolve, 1500));

		isLoading = false;

		// Auto login mechanism (mocked)
		showSuccess('Registration successful! Logging you in...');

		setTimeout(() => {
			goto('/'); // Redirect to home/dashboard on successful auto-login
		}, 1500);
	}
</script>

<svelte:head>
	<title>Register - UniThread</title>
</svelte:head>

<!-- Toast Notifications -->
<div>
	{#if errorToast}
		{errorToast}
	{/if}
	{#if successToast}
		{successToast}
	{/if}
</div>

<div>
	<!-- Register Card -->
	<div>
		<div>
			<h1>Create an Account</h1>
			<p>Join UniThread to start connecting</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="email">Email Address</label>
				<input bind:value={email} type="email" id="email" placeholder="you@example.com" required />
			</div>

			<div>
				<label for="username">Username</label>
				<input
					bind:value={username}
					type="text"
					id="username"
					placeholder="unique_handle"
					required
				/>
			</div>

			<div>
				<label for="password">Password</label>
				<div class="flex items-center gap-2">
					<input
						bind:value={password}
						type={showPassword ? 'text' : 'password'}
						id="password"
						placeholder="At least 8 characters"
						required
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
					>
						{showPassword ? 'Hide' : 'Show'}
					</button>
				</div>
			</div>

			<div>
				<label for="confirmPassword">Confirm Password</label>
				<div>
					<input
					bind:value={confirmPassword}
					type={showPassword ? 'text' : 'password'}
					id="confirmPassword"
					placeholder="Passwords must match"
					required
					/>
				</div>
			</div>

			<button type="submit" disabled={isLoading}>
				{#if isLoading}
					<span class="absolute inset-0 flex items-center justify-center">
						<svg
							class="mr-2 -ml-1 h-5 w-5 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
							></path>
						</svg>
						Processing...
					</span>
					<span class="opacity-0">Register</span>
				{:else}
					<span class="relative z-10 flex items-center justify-center gap-2"> Register </span>
				{/if}
			</button>
		</form>

		<div>
			Already have an account?
			<a href="/login"> Sign in here </a>
		</div>
	</div>
</div>
