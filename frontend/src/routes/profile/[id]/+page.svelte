<script lang="ts">
	import type { PageData } from './$types';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Mail, Shield, Calendar, UserPlus, MessageSquare } from '@lucide/svelte';
	import { user as currentUser } from '$lib/stores/user.svelte';
	import { toasts } from '$lib/stores/toast.svelte';

	let { data }: { data: PageData } = $props();

	let targetUser = $derived(data.targetUser);
	let isMe = $derived(currentUser.isAuthenticated && currentUser.id === targetUser.id);
	let initials = $derived(targetUser.username.substring(0, 2).toUpperCase());
	let memberSince = $derived(new Date(targetUser.created_at).toLocaleString('en-US', { month: 'long', year: 'numeric' }));

	function handleFollow() {
		toasts.show(`Following ${targetUser.username} (feature coming soon)`, 'success');
	}

	function handleMessage() {
		toasts.show(`Messaging ${targetUser.username} (feature coming soon)`, 'success');
	}
</script>

<svelte:head>
	<title>{targetUser.username}'s Profile - UniThread</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6">
	<Card.Root
		class="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border-border bg-card/95 shadow-[0_0_40px_rgba(50,65,95,0.15)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(50,65,95,0.25)]"
	>
		<div class="custom-scrollbar overflow-y-auto pt-8 pb-6 px-6">
			<div class="mb-6 text-center sm:mb-8">
				<!-- Avatar Section -->
				<div class="mx-auto mb-6 flex justify-center">
					<UserAvatar
						src={targetUser.avatar_key}
						{initials}
						size="lg"
						className="ring-4 ring-border shadow-xl"
					/>
				</div>

				<!-- Names -->
				<h1 class="m-0 px-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
					{targetUser.username}
				</h1>
				<p class="mt-1 text-sm font-medium text-muted-foreground sm:text-base">@{targetUser.username}</p>

				<!-- Profile Actions -->
				{#if !isMe}
					<div class="mt-6 flex items-center justify-center gap-3">
						<Button 
							onclick={handleFollow}
							class="flex-1 bg-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
						>
							<UserPlus class="mr-2 h-4 w-4" />
							Follow
						</Button>
						<Button 
							variant="outline" 
							onclick={handleMessage}
							class="flex-1 border-border font-bold hover:bg-secondary"
						>
							<MessageSquare class="mr-2 h-4 w-4" />
							Message
						</Button>
					</div>
				{:else}
					<div class="mt-6">
						<Button 
							href="/profile"
							variant="outline"
							class="w-full border-primary/30 bg-primary/5 font-bold text-primary hover:bg-primary/10"
						>
							Edit My Profile
						</Button>
					</div>
				{/if}
			</div>

			<Card.Content class="space-y-4 p-0 sm:space-y-6">
				<!-- Info List -->
				<div class="flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-secondary/50 sm:gap-5">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
						<Shield class="h-5 w-5" />
					</div>
					<div class="flex min-w-0 flex-col">
						<span class="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[10px]">
							University ID
						</span>
						<span class="text-sm font-medium text-foreground sm:text-base">{targetUser.university_id}</span>
					</div>
				</div>

				<div class="flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-secondary/50 sm:gap-5">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
						<Calendar class="h-5 w-5" />
					</div>
					<div class="flex min-w-0 flex-col">
						<span class="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[10px]">
							Member Since
						</span>
						<span class="text-sm font-medium text-foreground sm:text-base">{memberSince}</span>
					</div>
				</div>
			</Card.Content>
		</div>
	</Card.Root>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #3f3f46;
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}
</style>
