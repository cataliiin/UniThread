<script lang="ts">
	import RegisterForm from '$lib/components/RegisterForm.svelte';
</script>

<svelte:head>
	<title>Register - UniThread</title>
</svelte:head>

<section class="flex min-h-screen items-center justify-center bg-background px-4 py-8">
	<div class="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
		<RegisterForm />
	</div>
</section>
