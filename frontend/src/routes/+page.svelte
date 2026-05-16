<script lang="ts">
	import { onMount } from 'svelte';
	import logo from '$lib/assets/UniThread_Logo.svg';

	let isVisible = $state(false);

	onMount(() => {
		isVisible = true;
	});
</script>

<svelte:head>
	<title>UniThread - Connect with your Campus</title>
	<meta name="description" content="The ultimate platform for university students to connect, share, and discover." />
</svelte:head>

<div class="min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden">
	<!-- Decorative background elements -->
	<div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
	<div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>

	<!-- Navigation Bar -->
	<nav class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md transition-all duration-300">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-card border border-border p-1 shadow-lg shadow-primary/20">
					<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
				</div>
				<span class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">UniThread</span>
			</div>
			<div class="flex items-center gap-4">
				<a href="/login" class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">Log In</a>
				<a href="/register" class="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-primary/50">Sign Up</a>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<main class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32">
		<div class="text-center transition-all duration-1000 transform {isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}">
			<div class="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
				<span class="flex h-2.5 w-2.5 rounded-full bg-primary mr-2 animate-pulse"></span>
				Built exclusively for UNITBV students
			</div>
			
			<h1 class="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl mb-8 leading-tight">
				Your Student Life in Brașov, <br/>
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/60 to-primary bg-300% animate-gradient">Unified in One Place.</span>
			</h1>
			
			<p class="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed font-medium">
				From Colina to Memorandului. Find notes for your exams, sell your books from last year, or simply connect and share experiences with your fellow students. It all happens here.
			</p>
			
			<div class="flex flex-col sm:flex-row items-center justify-center gap-5">
				<a href="/register" class="w-full sm:w-auto rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(var(--primary-rgb),0.6)] flex items-center justify-center gap-2">
					Join the Community
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
				</a>
				<a href="/login" class="w-full sm:w-auto rounded-full bg-card border-2 border-border px-8 py-4 text-base font-bold text-foreground shadow-lg transition-all duration-300 hover:bg-muted hover:scale-105 hover:border-primary/50 flex items-center justify-center">
					I have an account
				</a>
			</div>
		</div>

		<!-- Features Grid -->
		<div class="mt-32 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-1000 delay-300 transform {isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}">
			<!-- Feature 1 -->
			<div class="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50">
				<div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 transition-transform duration-500 group-hover:scale-[2]"></div>
				<div class="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-6 shadow-inner border border-primary/10">
					<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
				</div>
				<h3 class="text-xl font-extrabold mb-3 text-foreground">Groups & Communities</h3>
				<p class="text-muted-foreground leading-relaxed">Whether you need help with Math, a board game squad, or a crew to hike up Tâmpa, find your tribe on campus.</p>
			</div>

			<!-- Feature 2 -->
			<div class="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50">
				<div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 transition-transform duration-500 group-hover:scale-[2]"></div>
				<div class="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-6 shadow-inner border border-primary/10">
					<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>
				</div>
				<h3 class="text-xl font-extrabold mb-3 text-foreground">Student Marketplace</h3>
				<p class="text-muted-foreground leading-relaxed">Swap, sell, or buy. From ancient textbooks to dorm spots or tickets for a local festival.</p>
			</div>

			<!-- Feature 3 -->
			<div class="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50 sm:col-span-2 lg:col-span-1">
				<div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 transition-transform duration-500 group-hover:scale-[2]"></div>
				<div class="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-6 shadow-inner border border-primary/10">
					<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
				</div>
				<h3 class="text-xl font-extrabold mb-3 text-foreground">Interactive Map</h3>
				<p class="text-muted-foreground leading-relaxed">Lost again looking for your faculty building? Instantly find lecture halls, the cafeteria, labs, or the University Aula.</p>
			</div>
		</div>
	</main>
</div>

<style>
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	.animate-gradient {
		background-size: 300%;
		animation: gradient 8s ease infinite;
	}
</style>
