<script lang="ts">
	import { photoViewer } from '$lib/stores/photoViewer.svelte';
	import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	let zoom = $state(1);
	let pos = $state({ x: 0, y: 0 });
	let dragging = $state(false);
	let last = $state({ x: 0, y: 0 });

	$effect(() => {
		if (!photoViewer.isOpen) {
			zoom = 1;
			pos = { x: 0, y: 0 };
		}
	});

	const handlePointerDown = (e: PointerEvent) => {
		dragging = true;
		last = { x: e.clientX - pos.x, y: e.clientY - pos.y };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: PointerEvent) => {
		if (!dragging) return;
		pos = { x: e.clientX - last.x, y: e.clientY - last.y };
	};

	const handlePointerUp = (e: PointerEvent) => {
		dragging = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	};

	const handleWheel = (e: WheelEvent) => {
		e.preventDefault();
		const next = zoom + (e.deltaY > 0 ? -0.2 : 0.2);
		zoom = Math.max(0.5, Math.min(5, next));
	};

	const reset = () => { zoom = 1; pos = { x: 0, y: 0 }; };

	onMount(() => {
		const intercept = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			if (t.tagName === 'IMG') {
				const img = t as HTMLImageElement;
				if (img.classList.contains('no-view') || img.width < 32 || img.src.includes('Logo')) return;
				e.preventDefault(); e.stopPropagation();
				photoViewer.open(img.src, img.alt);
			}
		};
		window.addEventListener('click', intercept, true);
		return () => window.removeEventListener('click', intercept, true);
	});

	$effect(() => {
		document.body.style.overflow = photoViewer.isOpen ? 'hidden' : '';
	});
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && photoViewer.close()} />

{#if photoViewer.isOpen && photoViewer.src}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md select-none"
		onclick={(e) => e.target === e.currentTarget && photoViewer.close()}
	>
		<div class="absolute top-6 right-6 z-50 flex gap-3" transition:fade={{ delay: 200 }}>
			<div class="flex items-center gap-1 rounded-full border border-border bg-card/50 p-1.5 backdrop-blur-sm shadow-xl">
				<button onclick={() => zoom = Math.max(0.5, zoom - 0.5)} class="p-2 text-muted-foreground hover:text-primary"><ZoomOut class="h-5 w-5" /></button>
				<span class="min-w-[3rem] text-center text-sm font-bold">{Math.round(zoom * 100)}%</span>
				<button onclick={() => zoom = Math.min(5, zoom + 0.5)} class="p-2 text-muted-foreground hover:text-primary"><ZoomIn class="h-5 w-5" /></button>
				<div class="mx-1 h-4 w-px bg-border"></div>
				<button onclick={reset} class="p-2 text-muted-foreground hover:text-primary"><RotateCcw class="h-5 w-5" /></button>
			</div>
			<button onclick={() => photoViewer.close()} class="rounded-full border border-border bg-card/50 p-2.5 text-muted-foreground hover:text-destructive shadow-xl"><X class="h-6 w-6" /></button>
		</div>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="relative flex h-full w-full items-center justify-center overflow-hidden p-12 touch-none"
			onwheel={handleWheel}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
		>
			<img
				transition:scale={{ duration: 300, start: 0.9 }}
				src={photoViewer.src}
				alt={photoViewer.alt}
				class="max-h-full max-w-full rounded-lg shadow-2xl {dragging ? '' : 'transition-transform duration-200'}"
				style:transform="translate3d({pos.x}px, {pos.y}px, 0) scale({zoom})"
				style:cursor={dragging ? 'grabbing' : 'grab'}
				draggable="false"
				ondragstart={e => e.preventDefault()}
				ondblclick={reset}
			/>
		</div>

		{#if photoViewer.alt}
			<div class="absolute bottom-10 rounded-full border border-border bg-card/50 px-6 py-2 backdrop-blur-sm" transition:fade={{ delay: 200 }}>
				<p class="text-sm font-medium">{photoViewer.alt}</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	img { will-change: transform; }
</style>
