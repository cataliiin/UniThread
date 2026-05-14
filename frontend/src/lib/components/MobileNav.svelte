<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user.svelte';
	import { invitationsState } from '$lib/stores/invitations.svelte';
	import UserAvatar from './UserAvatar.svelte';

	let avatarUrl = $derived(user?.avatarSource);
	let pendingInvites = $derived(invitationsState?.pendingCount || 0);

	interface MobileNavLink {
		href: string;
		label: string;
		icon?: string;
		isAvatar?: boolean;
		badge?: boolean;
	}

	let navLinks = $derived([
		{
			href: '/',
			label: 'Home',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
		},

		{
			href: '/map',
			label: 'Map',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
		},
		{
			href: '/projects',
			label: 'Projects',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`
		},
		{
			href: '/invitations',
			label: 'Invites',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="m9 9 2 2 4-4"/></svg>`,
			badge: pendingInvites > 0
		},
		{
			href: '/communities',
			label: 'Groups',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
		},
		{
			href: '/messages',
			label: 'Chat',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
		},

		{
			href: '/library',
			label: 'Library',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
		},

		{
			href: '/profile',
			label: 'Profile',
			isAvatar: true
		}
	]);
</script>

{#snippet navItem(link: MobileNavLink)}
	<a
		href={link.href}
		class="relative flex h-full w-full flex-col items-center justify-center gap-1 transition-all duration-300
		{$page.url.pathname === link.href
			? 'font-medium text-primary'
			: 'text-muted-foreground hover:text-foreground'}"
	>
		<span class="relative flex items-center justify-center">
			{#if link.isAvatar}
				<UserAvatar src={avatarUrl} initials={user?.avatarInitials || ''} size="xs" />
			{:else}
				{@html link.icon}
			{/if}
			{#if link.badge}
				<span
					class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-destructive shadow-sm"
				></span>
			{/if}
		</span>
		<span class="text-[10px] tracking-wider uppercase">{link.label}</span>
	</a>
{/snippet}

<nav
	class="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-sidebar-border bg-sidebar lg:hidden"
>
	<div class="flex h-16 items-center justify-around">
		{#each navLinks as link}
			{@render navItem(link)}
		{/each}
	</div>
</nav>

<style>
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
