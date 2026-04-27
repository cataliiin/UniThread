<script lang="ts">
	import { page } from '$app/stores';

	const user = {
		name: 'Sebastian G.',
		username: 'sebig'
	};

	const navLinks = [
		{ 
			href: '/', 
			label: 'Home', 
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
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
			href: '/settings', 
			label: 'Settings', 
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
		}
	];
</script>

<aside class="hidden lg:flex flex-col w-72 h-full bg-slate-950 border-r border-slate-800 transition-all duration-300">
	<!-- Header -->
	<div class="p-6 flex items-center gap-4 border-b border-slate-800/50">
		<div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
		</div>
		<span class="text-xl font-bold tracking-tight text-white">UniThread</span>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto py-6 px-4 space-y-1">
		{#each navLinks as link}
			<a
				href={link.href}
				class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
				{$page.url.pathname === link.href 
					? 'bg-indigo-600/10 text-indigo-400 font-semibold' 
					: 'text-slate-400 hover:bg-slate-800 hover:text-white'}"
			>
				<span class="flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
					{@html link.icon}
				</span>
				<span class="text-sm tracking-wide">{link.label}</span>
			</a>
		{/each}
	</nav>

	<!-- Footer -->
	<div class="p-4 mt-auto border-t border-slate-800/50">
		<div class="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 transition-all duration-200">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 rounded-full border border-slate-700 shadow-sm flex items-center justify-center bg-slate-800 text-slate-400">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="font-semibold text-sm text-white truncate">{user.name}</span>
					<span class="text-xs text-slate-500 truncate">@{user.username}</span>
				</div>
			</div>
			<button class="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200" title="Logout">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
			</button>
		</div>
	</div>
</aside>
