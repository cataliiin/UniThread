<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { communityState } from '$lib/stores/community.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { toasts } from '$lib/stores/toast.svelte';
	import Feed from '$lib/components/Feed.svelte';

	let { data }: { data: PageData } = $props();

	let community = $derived(data.community);
	let isAdmin = $derived(data.isAdmin);
	let isOwner = $derived(data.isOwner);

	let menuOpen = $state(false);
	let leaveConfirm = $state(false);
	let leavingLoading = $state(false);

	function getImageUrl(key: string | null): string | null {
		if (!key) return null;
		if (key.startsWith('local_img_')) return localStorage.getItem(key);
		return `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000/community-assets'}/${key}`;
	}

	async function handleLeave() {
		if (!community) return;
		leavingLoading = true;
		const ok = await communityState.leaveCommunity(community.id);
		leavingLoading = false;
		if (ok) goto('/communities');
	}

	function closeMenu() {
		menuOpen = false;
		leaveConfirm = false;
	}
</script>

<svelte:head>
	<title>{community ? `${community.name} - Community` : 'Community'} - UniThread</title>
</svelte:head>

<!-- Click outside overlay -->
{#if menuOpen}
	<button
		class="fixed inset-0 z-20"
		onclick={closeMenu}
		aria-label="Close menu"
	></button>
{/if}

<div class="min-h-screen bg-background">
	{#if community}
		<!-- Banner -->
		<div class="relative h-52 w-full overflow-hidden">
			{#if community.banner_key}
				<img
					src={getImageUrl(community.banner_key)}
					alt="{community.name} banner"
					class="h-full w-full object-cover"
				/>
			{:else}
				<div class="h-full w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
			{/if}
			<!-- Dark gradient overlay bottom -->
			<div class="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
		</div>

		<div class="mx-auto max-w-4xl px-4">
			<!-- Community Header -->
			<div class="relative -mt-16 mb-6 flex items-end gap-4">
				<!-- Icon -->
				<div class="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-slate-800 shadow-xl">
					{#if community.icon_key}
						<img src={getImageUrl(community.icon_key)} alt="{community.name} icon" class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-indigo-600 text-4xl font-bold text-white">
							{community.name.charAt(0).toUpperCase()}
						</div>
					{/if}
				</div>

				<!-- Name & Meta -->
				<div class="mb-2 min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="text-2xl font-bold text-foreground">{community.name}</h1>
						<span class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
							{community.type}
						</span>
						{#if isOwner}
							<span class="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">Owner</span>
						{:else if isAdmin}
							<span class="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">Admin</span>
						{/if}
					</div>
					<p class="mt-1 text-sm text-muted-foreground">{community.member_count} members</p>
				</div>

				<!-- Action Buttons -->
				<div class="mb-2 flex shrink-0 items-center gap-2">
					<!-- Members Button -->
					<a
						href="/communities/{community.id}/members"
						id="btn-members"
						class="flex items-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
						Members
					</a>

					<!-- 3-dot Menu -->
					<div class="relative z-30">
						<button
							id="btn-community-menu"
							onclick={() => { menuOpen = !menuOpen; leaveConfirm = false; }}
							class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-sidebar text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
							aria-label="More options"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
							</svg>
						</button>

						{#if menuOpen}
							<div class="absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/20">
								{#if isAdmin}
									<button
										onclick={() => { goto(`/communities/${community.id}/edit`); closeMenu(); }}
										class="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
										</svg>
										Edit Community
									</button>
									<a
										href="/communities/{community.id}/admin"
										onclick={closeMenu}
										class="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
										</svg>
										Admin Dashboard
									</a>
									<div class="my-1 border-t border-border"></div>
								{/if}

								{#if !isOwner}
									{#if !leaveConfirm}
										<button
											onclick={() => (leaveConfirm = true)}
											class="flex w-full items-center gap-3 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
												<polyline points="16 17 21 12 16 7"/>
												<line x1="21" x2="9" y1="12" y2="12"/>
											</svg>
											Leave Community
										</button>
									{:else}
										<div class="px-4 py-3">
											<p class="text-xs text-muted-foreground mb-3">Are you sure you want to leave?</p>
											<div class="flex gap-2">
												<button
													onclick={handleLeave}
													disabled={leavingLoading}
													class="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/80 disabled:opacity-60"
												>
													{leavingLoading ? 'Leaving…' : 'Yes, Leave'}
												</button>
												<button
													onclick={() => (leaveConfirm = false)}
													class="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
												>
													Cancel
												</button>
											</div>
										</div>
									{/if}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Description -->
			{#if community.description}
				<div class="mb-6 rounded-xl border border-border bg-sidebar/60 p-4">
					<p class="break-words text-sm text-muted-foreground leading-relaxed">{community.description}</p>
				</div>
			{/if}

			<!-- Settings Info Pills -->
			<div class="mb-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
				{#if community.allow_anonymous}
					<span class="flex items-center gap-1.5 rounded-full border border-border bg-sidebar px-3 py-1.5">
						<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
						</svg>
						Anonymous posts allowed
					</span>
				{/if}
				<span class="flex items-center gap-1.5 rounded-full border border-border bg-sidebar px-3 py-1.5 capitalize">
					<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
					{community.type}
				</span>
			</div>

			<!-- Posts Feed Placeholder -->
			<div class="rounded-xl border border-dashed border-border bg-sidebar/40 p-10 text-center">
				<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
					</svg>
				</div>
				<p class="text-sm font-medium text-foreground">Posts feed coming soon</p>
				<p class="mt-1 text-xs text-muted-foreground">This is where community posts will appear.</p>
			<!-- Posts Feed -->
			<div class="mt-8">
				<Feed communityId={community.id} />
			</div>
		</div>
	{:else}
		<div class="flex h-screen items-center justify-center">
			<div class="text-center">
				<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
				<p class="mt-4 text-sm text-muted-foreground">Loading community…</p>
			</div>
		</div>
	{/if}
</div>
