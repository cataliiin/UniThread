<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	let examDate = new Date('2026-06-02T00:00:00').getTime();
	let now = $state(Date.now());
	let isFullscreen = $state(false);

	$effect(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	let timeLeft = $derived(Math.max(0, examDate - now));
	let days = $derived(Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
	let hours = $derived(Math.floor((timeLeft / (1000 * 60 * 60)) % 24));
	let minutes = $derived(Math.floor((timeLeft / 1000 / 60) % 60));
	let seconds = $derived(Math.floor((timeLeft / 1000) % 60));

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
	}
</script>

<!-- Sidebar Widget -->
<button
	onclick={toggleFullscreen}
	class="mx-4 mt-2 mb-4 flex w-[calc(100%-2rem)] flex-col items-center rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 to-primary/5 p-4 text-left shadow-lg shadow-primary/5 transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:shadow-primary/20 focus:outline-none"
>
	<div class="mb-3 flex w-full items-center justify-between">
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-primary"
				><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg
			>
			<h3 class="text-xs font-bold tracking-wider text-primary uppercase">Exams Countdown</h3>
		</div>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="text-primary/60"
			><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path
				d="M3 21l7-7"
			/></svg
		>
	</div>

	<div class="flex w-full justify-between gap-1.5">
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-xl bg-background/80 p-1.5 shadow-sm backdrop-blur-sm"
		>
			<span class="text-xl font-black text-foreground">{days}</span>
			<span class="text-[9px] font-bold text-muted-foreground uppercase">Days</span>
		</div>
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-xl bg-background/80 p-1.5 shadow-sm backdrop-blur-sm"
		>
			<span class="text-xl font-black text-foreground">{hours.toString().padStart(2, '0')}</span>
			<span class="text-[9px] font-bold text-muted-foreground uppercase">Hrs</span>
		</div>
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-xl bg-background/80 p-1.5 shadow-sm backdrop-blur-sm"
		>
			<span class="text-xl font-black text-foreground">{minutes.toString().padStart(2, '0')}</span>
			<span class="text-[9px] font-bold text-muted-foreground uppercase">Min</span>
		</div>
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-xl bg-background/80 p-1.5 shadow-sm backdrop-blur-sm"
		>
			<span class="text-xl font-black text-primary">{seconds.toString().padStart(2, '0')}</span>
			<span class="text-[9px] font-bold text-primary/70 uppercase">Sec</span>
		</div>
	</div>
</button>

<!-- Fullscreen Overlay -->
{#if isFullscreen}
	<div
		class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl transition-all"
		transition:fade={{ duration: 200 }}
	>
		<button
			onclick={toggleFullscreen}
			class="absolute top-8 right-8 rounded-full bg-secondary p-4 text-secondary-foreground transition-all hover:scale-110 hover:bg-secondary/80 focus:outline-none"
			aria-label="Close fullscreen"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
			>
		</button>

		<div
			class="mb-12 flex items-center gap-4 text-primary"
			in:scale={{ duration: 400, delay: 100, start: 0.9 }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg
			>
			<h1 class="text-4xl font-black tracking-tight uppercase lg:text-6xl">Summer Exams Session</h1>
		</div>

		<div
			class="flex flex-wrap items-center justify-center gap-4 sm:gap-8"
			in:scale={{ duration: 500, delay: 200, start: 0.8 }}
		>
			<div
				class="flex w-32 flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 shadow-2xl sm:w-48 sm:p-10"
			>
				<span class="text-5xl font-black tracking-tighter text-foreground sm:text-8xl">{days}</span>
				<span
					class="mt-2 text-sm font-bold tracking-widest text-muted-foreground uppercase sm:mt-4 sm:text-xl"
					>Days</span
				>
			</div>
			<div
				class="flex w-32 flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 shadow-2xl sm:w-48 sm:p-10"
			>
				<span class="text-5xl font-black tracking-tighter text-foreground sm:text-8xl"
					>{hours.toString().padStart(2, '0')}</span
				>
				<span
					class="mt-2 text-sm font-bold tracking-widest text-muted-foreground uppercase sm:mt-4 sm:text-xl"
					>Hours</span
				>
			</div>
			<div
				class="flex w-32 flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 shadow-2xl sm:w-48 sm:p-10"
			>
				<span class="text-5xl font-black tracking-tighter text-foreground sm:text-8xl"
					>{minutes.toString().padStart(2, '0')}</span
				>
				<span
					class="mt-2 text-sm font-bold tracking-widest text-muted-foreground uppercase sm:mt-4 sm:text-xl"
					>Minutes</span
				>
			</div>
			<div
				class="flex w-32 flex-col items-center justify-center rounded-3xl border border-primary/30 bg-primary/10 p-6 shadow-2xl shadow-primary/20 sm:w-48 sm:p-10"
			>
				<span class="text-5xl font-black tracking-tighter text-primary sm:text-8xl"
					>{seconds.toString().padStart(2, '0')}</span
				>
				<span
					class="mt-2 text-sm font-bold tracking-widest text-primary/80 uppercase sm:mt-4 sm:text-xl"
					>Seconds</span
				>
			</div>
		</div>

		<p
			class="mt-16 text-lg font-medium text-muted-foreground"
			in:scale={{ duration: 400, delay: 300, start: 0.9 }}
		>
			Starting on June 2, 2026
		</p>
	</div>
{/if}
