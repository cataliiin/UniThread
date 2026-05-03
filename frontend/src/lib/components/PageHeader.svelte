<script lang="ts">
	import UserAvatar from './UserAvatar.svelte';
	import { user } from '$lib/stores/user.svelte';
	import NotificationHub from './NotificationHub.svelte';

	let {
		title,
		subtitle = '',
		showProfileLink = true
	} = $props<{
		title: string;
		subtitle?: string;
		showProfileLink?: boolean;
	}>();
</script>

<header class="mb-10 flex items-center justify-between">
	<div class="space-y-1">
		<h1 class="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
		{#if subtitle}
			<p class="text-muted-foreground">{subtitle}</p>
		{/if}
	</div>
	<!-- ADD THIS WRAPPER DIV -->
	<div class="flex items-center gap-4">
		<!-- DROP THE HUB HERE -->
		<NotificationHub />
		{#if showProfileLink}
			<a
				href="/profile"
				class="group relative block transition-transform duration-300 hover:scale-105"
			>
				<UserAvatar src={user.avatarUrl} initials={user.avatarInitials} size="md" />
				<div
					class="absolute inset-0 rounded-full bg-primary/0 ring-4 ring-transparent transition-all duration-300 group-hover:bg-primary/5 group-hover:ring-primary/20"
				></div>
			</a>
		{/if}
	</div>
</header>
