<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
</script>

<svelte:head>
	<title>Login - UniThread</title>
</svelte:head>

<section class="flex h-screen items-center justify-center bg-slate-950">
	<div class="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
		<LoginForm />
	</div>
</section>
