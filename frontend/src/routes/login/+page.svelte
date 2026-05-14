<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
</script>

<svelte:head>
	<title>Login - UniThread</title>
</svelte:head>

<section class="flex min-h-screen items-center justify-center bg-background px-4 py-8">
	<div class="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
		<LoginForm />
	</div>
</section>
