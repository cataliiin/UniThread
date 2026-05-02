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
			href: '/search',
			label: 'Search',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>`
		},
		{
			href: '/dashboard',
			label: 'Dashboard',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`
		},
		{
			href: '/projects',
			label: 'Projects',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`
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
			href: '/communities/new',
			label: 'Create Community',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`
		},
		{
			href: '/settings',
			label: 'Settings',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l-.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 1-1.72v-.51a2 2 0 0 1 1-1.74l-.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
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
		class="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200
		{$page.url.pathname === link.href
			? 'bg-indigo-600/10 font-semibold text-indigo-400'
			: 'text-slate-400 hover:bg-slate-800 hover:text-white'}"
	>
		<span
			class="flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
		>
			{@html link.icon}
		</span>
		<span class="text-sm tracking-wide">{link.label}</span>
		{#if link.badge && link.badge > 0}
			<span class="ml-auto rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-medium text-white">
				{link.badge}
			</span>
		{/if}
	</a>
{/snippet}

<aside
	class="hidden h-full w-72 flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 lg:flex"
>
	<!-- Header -->
	<div class="flex items-center gap-4 border-b border-slate-800/50 p-6">
		<div
			class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-indigo-500/20"
		>
			<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
		</div>
		<span class="text-xl font-bold tracking-tight text-white">UniThread</span>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1 overflow-y-auto px-4 py-6">
		{#each navLinks as link}
			{@render navLink(link)}
		{/each}
	</nav>

	<!-- Footer -->
	<div class="mt-auto border-t border-slate-800/50 p-4">
		<div
			class="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-3 transition-all duration-200"
		>
			<a href="/profile" class="flex items-center gap-3">
				<UserAvatar src={avatarUrl} initials={user.avatarInitials} size="sm" />
				<div class="flex min-w-0 flex-col">
					<span class="truncate text-sm font-semibold text-white">{user.name}</span>
					<span class="truncate text-xs text-slate-500">@{user.username}</span>
				</div>
			</a>
			<button
				onclick={handleLogout}
				class="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-red-400/10 hover:text-red-400"
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
