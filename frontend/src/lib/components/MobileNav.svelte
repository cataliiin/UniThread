<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user.svelte';
	import { invitationsState } from '$lib/stores/invitations.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import MobileMoreMenu from './MobileMoreMenu.svelte';

	let avatarUrl = $derived(user?.avatarSource);
	let pendingInvites = $derived(invitationsState?.pendingCount || 0);
	let moreOpen = $state(false);

	interface MobileNavLink {
		href: string;
		label: string;
		icon?: string;
		isAvatar?: boolean;
		badge?: boolean;
		isMore?: boolean;
	}

	let navLinks = $derived([
		{
			href: '/dashboard',
			label: 'Feed',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`
		},
		{
			href: '/messages',
			label: 'Chat',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
		},
		{
			href: '/communities',
			label: 'Groups',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
		},
		{
			href: '/marketplace',
			label: 'Market',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>`
		},
		{
			href: '#more',
			label: 'More',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
			badge: pendingInvites > 0,
			isMore: true
		}
	]);
</script>

{#snippet navItem(link: MobileNavLink)}
	{#if link.isMore}
		<button
			onclick={() => (moreOpen = !moreOpen)}
			class="relative flex h-full w-full flex-col items-center justify-center gap-1 transition-all duration-300
			{moreOpen
				? 'font-medium text-primary'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			<span class="relative flex items-center justify-center">
				{@html link.icon}
				{#if link.badge}
					<span
						class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-destructive shadow-sm"
					></span>
				{/if}
			</span>
			<span class="text-[10px] tracking-wider uppercase">{link.label}</span>
		</button>
	{:else}
		<a
			href={link.href}
			onclick={() => (moreOpen = false)}
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
	{/if}
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

<!-- Modular Slide-up More Menu sitting exactly above the navbar -->
<MobileMoreMenu
	open={moreOpen}
	onClose={() => (moreOpen = false)}
	{avatarUrl}
	{pendingInvites}
/>

<style>
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
