<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import { invitationsState } from '$lib/stores/invitations.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import logo from '$lib/assets/UniThread_Logo.svg';

	let avatarUrl = $derived(user.avatarUrl);
	let pendingInvites = $derived(invitationsState.pendingCount);

	interface NavLink {
		href: string;
		label: string;
		icon: string;
		badge?: number;
	}

	let navLinks = $derived([
		{
			href: '/',
			label: 'Home',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
		},
		{
			href: '/posts/new',
			label: 'Create Post',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
		},
		{
			href: '/search',
			label: 'Search',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>`
		},
		{
			href: '/map',
			label: 'Campus Map',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
		},
		{
			href: '/library',
			label: 'My Library',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>`
		},
		{
			href: '/messages',
			label: 'Messages',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
		},
		{
			href: '/invitations',
			label: 'Invitations',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="m9 9 2 2 4-4"/></svg>`,
			badge: pendingInvites
		},
		{
			href: '/communities',
			label: 'My Communities',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
		},
		{
			href: '/communities/new',
			label: 'Create Community',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`
		}
	]);

	import { goto } from '$app/navigation';

	function handleLogout() {
		user.logout();
		toasts.show('Logged out successfully', 'info');
		goto('/login');
	}
</script>

{#snippet navLink(link: NavLink)}
	<a
		href={link.href}
		class="group glitch flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300
		{$page.url.pathname === link.href
			? 'bg-primary/10 font-semibold text-primary shadow-[0_0_15px_rgba(50,65,95,0.15)]'
			: 'text-muted-foreground hover:bg-secondary hover:text-foreground'}"
	>
		<span
			class="sidebar-icon flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
		>
			{@html link.icon}
		</span>
		<span class="text-sm tracking-wide">{link.label}</span>
		{#if link.badge && link.badge > 0}
			<span
				class="ml-auto animate-pulse rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/30"
			>
				{link.badge}
			</span>
		{/if}
	</a>
{/snippet}

<aside
	class="hidden h-full w-72 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex"
>
	<!-- Header -->
	<div class="flex items-center gap-4 border-b border-sidebar-border p-6">
		<div
			class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40"
		>
			<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
		</div>
		<span class="text-xl font-bold tracking-tight text-sidebar-foreground">UniThread</span>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1 overflow-y-auto px-4 py-6">
		{#each navLinks as link}
			{@render navLink(link)}
		{/each}
	</nav>

	<!-- Footer -->
	<div class="mt-auto border-t border-sidebar-border p-4">
		<div
			class="flex items-center justify-between rounded-2xl border border-sidebar-border bg-sidebar-accent p-3 transition-all duration-300 hover:border-primary/30"
		>
			<a href="/profile" class="flex items-center gap-3">
				<UserAvatar src={avatarUrl} initials={user.avatarInitials} size="sm" />
				<div class="flex min-w-0 flex-col">
					<span class="truncate text-sm font-semibold text-sidebar-accent-foreground"
						>{user.name}</span
					>
					<span class="truncate text-xs text-muted-foreground">@{user.username}</span>
				</div>
			</a>
			<button
				onclick={handleLogout}
				class="rounded-lg p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
				title="Logout"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
						points="16 17 21 12 16 7"
					/><line x1="21" x2="9" y1="12" y2="12" /></svg
				>
			</button>
		</div>
	</div>
</aside>
