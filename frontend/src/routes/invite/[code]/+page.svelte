<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { InvitationsService } from '$lib/api/services/InvitationsService';
	import { toast } from '$lib/stores/toast.svelte';
	import { user } from '$lib/stores/user.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Loader2, Users } from '@lucide/svelte';
	import logo from '$lib/assets/UniThread_Logo.svg';

	let loading = $state(false);

	async function acceptInvite() {
		if (!$page.data?.invite) return;

		loading = true;
		try {
			await InvitationsService.acceptInviteLink($page.data.invite.code);
			toast.success('Successfully joined the community!');
			await goto(`/communities/${$page.data.invite.community.id}`);
		} catch (e) {
			toast.error('Failed to join the community. The link may be expired or already used.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Join Community - UniThread</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center py-12 px-4">
	<div class="max-w-md w-full">
		{#if $page.data?.invite}
			<div class="rounded-2xl border border-border bg-card p-8 shadow-xl">
				<div class="mb-8 flex flex-col items-center">
					<div class="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40">
						<img src={logo} alt="UniThread Logo" class="h-full w-full object-contain" />
					</div>
					<div class="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
						<Users class="h-10 w-10 text-primary" />
					</div>
					<h1 class="text-2xl font-bold text-foreground mb-2">You've been invited!</h1>
					<p class="text-muted-foreground text-center">Join <span class="font-semibold text-primary">{$page.data.invite.community.name}</span> on UniThread</p>
				</div>

				<div class="bg-muted/50 rounded-xl p-6 mb-8 border border-border">
					<h2 class="text-lg font-semibold text-foreground mb-3">{$page.data.invite.community.name}</h2>
					<p class="text-muted-foreground mb-2">Type: <span class="capitalize">{$page.data.invite.community.type}</span></p>
					{#if $page.data.invite.expires_at}
						<p class="text-muted-foreground text-sm">
							Expires on {new Date($page.data.invite.expires_at).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</p>
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					{#if user.isAuthenticated}
						<Button
							onclick={acceptInvite}
							disabled={loading}
							class="w-full bg-primary py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98]"
						>
							{#if loading}
								<span class="flex items-center justify-center gap-2">
									<Loader2 class="h-4 w-4 animate-spin" />
									Joining...
								</span>
							{:else}
								Join Community
							{/if}
						</Button>
					{:else}
						<a
							href="/login"
							class="w-full bg-primary py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] rounded-xl text-center"
						>
							Login to Join
						</a>
					{/if}
					<a
						href="/"
						class="w-full bg-secondary py-3 font-bold text-secondary-foreground rounded-xl text-center transition-all duration-300 hover:bg-secondary/80"
					>
						Go Home
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
