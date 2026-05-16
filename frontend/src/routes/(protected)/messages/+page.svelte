<script lang="ts">
	import { MessageSquare, Sparkles } from '@lucide/svelte';
</script>

<div class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-8 text-center relative overflow-hidden">
	<!-- Decorative grid background -->
	<div class="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

	<!-- Premium glassmorphic center card -->
	<div class="relative z-10 flex max-w-sm flex-col items-center p-8 rounded-3xl border border-border/60 bg-card/30 backdrop-blur-md shadow-2xl shadow-primary/5 transition-all duration-500 hover:shadow-primary/10 hover:border-primary/20 group">
		
		<!-- Rotating glowing ring under icon -->
		<div class="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-primary to-accent opacity-0 blur group-hover:opacity-10 transition-opacity duration-700"></div>

		<!-- Animated Icon Wrapper -->
		<div class="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/15 transition-transform duration-500 group-hover:scale-110">
			<MessageSquare class="h-10 w-10 text-primary transition-transform duration-700 group-hover:rotate-[360deg]" />
			<span class="absolute -top-1 -right-1 flex h-4 w-4">
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
				<span class="relative inline-flex rounded-full h-4 w-4 bg-accent/90 items-center justify-center text-[8px] text-accent-foreground font-black">
					<Sparkles class="h-2 w-2" />
				</span>
			</span>
		</div>

		<!-- Header -->
		<h2 class="text-xl font-extrabold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
			Your Conversations
		</h2>
		
		<!-- Subtext -->
		<p class="text-sm leading-relaxed text-muted-foreground">
			Select an existing chat from the left panel, or search for a student's name to start a brand new connection.
		</p>
	</div>
</div>
