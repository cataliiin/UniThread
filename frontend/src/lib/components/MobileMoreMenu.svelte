<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import UserAvatar from './UserAvatar.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		avatarUrl: string | null;
		pendingInvites: number;
	}

	let { open, onClose, avatarUrl, pendingInvites }: Props = $props();

	function handleLogout() {
		onClose();
		user.logout();
		toasts.show('Logged out successfully', 'info');
		goto('/login');
	}
</script>

{#if open}
	<!-- Backdrop - sits above bottom nav -->
	<button
		transition:fade={{ duration: 150 }}
		class="fixed top-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 z-40 bg-background/40 backdrop-blur-xs lg:hidden"
		onclick={onClose}
		aria-label="Close menu"
	></button>

	<!-- Floating Drawer Card extending from navbar -->
	<div
		transition:fly={{ y: 16, duration: 200 }}
		class="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 z-50 rounded-2xl border border-border bg-card p-5 shadow-2xl lg:hidden"
	>
		<!-- Header / Student Card -->
		<div class="mb-4 flex items-center justify-between border-b border-border/50 pb-4">
			<div class="flex items-center gap-3">
				<UserAvatar src={avatarUrl} initials={user?.avatarInitials || ''} size="md" />
				<div class="text-left">
					<p class="text-sm leading-none font-bold text-foreground">
						{user?.name || ''}
						{user?.surname || ''}
					</p>
					<p class="mt-1.5 text-[11px] text-muted-foreground">{user?.email || 'Student'}</p>
				</div>
			</div>
			<a
				href="/profile"
				onclick={onClose}
				class="rounded-lg border border-border bg-sidebar/55 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted"
			>
				Profile
			</a>
		</div>

		<!-- Menu Actions Grid (3x2 symmetrical premium cards) -->
		<div class="grid grid-cols-3 gap-3">
			<!-- Search -->
			<a
				href="/search"
				onclick={onClose}
				class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-sidebar/40 p-3 text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
			>
				<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
						><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg
					>
				</div>
				<span class="text-[11px] font-medium">Search</span>
			</a>

			<!-- Map -->
			<a
				href="/map"
				onclick={onClose}
				class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-sidebar/40 p-3 text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
			>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500"
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
						><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle
							cx="12"
							cy="10"
							r="3"
						/></svg
					>
				</div>
				<span class="text-[11px] font-medium">Map</span>
			</a>

			<!-- Invitations -->
			<a
				href="/invitations"
				onclick={onClose}
				class="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-sidebar/40 p-3 text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
			>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500"
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
						><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path
							d="m9 9 2 2 4-4"
						/></svg
					>
				</div>
				<span class="text-[11px] font-medium">Invites</span>
				{#if pendingInvites > 0}
					<span
						class="text-destructive-foreground absolute top-2 right-2 flex h-4.5 w-4.5 animate-pulse items-center justify-center rounded-full bg-destructive text-[9px] font-bold shadow-sm"
					>
						{pendingInvites}
					</span>
				{/if}
			</a>

			<!-- Create Post -->
			<a
				href="/posts/new"
				onclick={onClose}
				class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-sidebar/40 p-3 text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
			>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500"
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
						><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path
							d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
						/></svg
					>
				</div>
				<span class="text-[11px] font-medium">New Post</span>
			</a>

			<!-- Create Community -->
			<a
				href="/communities/new"
				onclick={onClose}
				class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-sidebar/40 p-3 text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
			>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500"
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
						stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg
					>
				</div>
				<span class="text-[11px] font-medium">New Group</span>
			</a>

			<!-- Logout Button -->
			<button
				onclick={handleLogout}
				class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-sidebar/40 p-3 text-red-500 transition-all hover:border-red-500/40 hover:bg-red-500/5"
			>
				<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
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
				</div>
				<span class="text-[11px] font-medium">Log Out</span>
			</button>
		</div>
	</div>
{/if}
