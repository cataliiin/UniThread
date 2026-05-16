<script lang="ts">
	import { goto } from '$app/navigation';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { StorageService } from '$lib/api/services/StorageService';
	import { ShieldAlert, VolumeX, Volume2, UserMinus, ArrowLeft } from '@lucide/svelte';
	import type { components } from '$lib/api/openapi-generated-schema';

	type UserProfileResponse = components['schemas']['UserProfileResponse'];

	let { 
		targetUser, 
		isBlocked, 
		isMuted, 
		onToggleBlock, 
		onToggleMute 
	}: {
		targetUser: UserProfileResponse | null;
		isBlocked: boolean;
		isMuted: boolean;
		onToggleBlock: () => void;
		onToggleMute: () => void;
	} = $props();

	function resolveAvatar(avatarKey: string | null) {
		if (!avatarKey) return null;
		return StorageService.getPublicUrl('user-assets', avatarKey);
	}

	function getInitials(u: any) {
		if (!u) return '';
		if (u.first_name && u.last_name) {
			return (u.first_name[0] + u.last_name[0]).toUpperCase();
		}
		return u.username.substring(0, 2).toUpperCase();
	}
</script>

<header class="flex h-16 items-center justify-between border-b border-border/60 bg-card/40 backdrop-blur-md px-4 sm:px-6 shrink-0 z-20">
	<div class="flex items-center gap-3">
		<button 
			onclick={() => goto('/messages')}
			class="lg:hidden p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-5 w-5" />
		</button>
		
		{#if targetUser}
			<a href="/profile/{targetUser.id}" class="flex items-center gap-3 group">
				<UserAvatar 
					src={resolveAvatar(targetUser.avatar_key)} 
					initials={getInitials(targetUser)} 
					size="sm" 
					className="group-hover:scale-105 transition-transform"
				/>
				<div class="flex flex-col min-w-0">
					<span class="text-sm font-bold truncate leading-tight group-hover:text-primary transition-colors">
						{targetUser.first_name && targetUser.last_name ? `${targetUser.first_name} ${targetUser.last_name}` : `@${targetUser.username}`}
					</span>
					{#if isBlocked}
						<span class="text-[10px] text-destructive flex items-center gap-1 font-bold uppercase tracking-widest mt-0.5">
							<ShieldAlert class="h-2.5 w-2.5" /> Blocked
						</span>
					{:else}
						<span class="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
							@{targetUser.username}
						</span>
					{/if}
				</div>
			</a>
		{:else}
			<div class="flex items-center gap-3 animate-pulse">
				<div class="h-9 w-9 rounded-full bg-muted"></div>
				<div class="space-y-1.5">
					<div class="h-3.5 w-24 rounded bg-muted"></div>
					<div class="h-2 w-16 rounded bg-muted"></div>
				</div>
			</div>
		{/if}
	</div>

	<div class="flex items-center gap-1">
		<button 
			onclick={onToggleMute}
			class="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
			title={isMuted ? 'Unmute' : 'Mute'}
		>
			{#if isMuted}
				<VolumeX class="h-5 w-5 text-destructive" />
			{:else}
				<Volume2 class="h-5 w-5" />
			{/if}
		</button>

		<button 
			onclick={onToggleBlock}
			class="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
			title={isBlocked ? 'Unblock' : 'Block'}
		>
			{#if isBlocked}
				<ShieldAlert class="h-5 w-5 text-destructive" />
			{:else}
				<UserMinus class="h-5 w-5" />
			{/if}
		</button>
	</div>
</header>
