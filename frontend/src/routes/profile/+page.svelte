<script lang="ts">
	import { user } from '$lib/stores/user.svelte';
	import { profileEditor } from '$lib/stores/profileEditor.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { slide, fade } from 'svelte/transition';
	import { Camera, Trash2, Mail, Shield, Calendar, Eye, EyeOff, Pencil, Loader2, Palette } from '@lucide/svelte';
	import { themeState } from '$lib/stores/theme.svelte';
</script>

<svelte:head>
	<title>Profile - UniThread</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6">
	<Card.Root
		class="relative flex max-h-[90vh] w-full max-w-[440px] sm:max-w-2xl flex-col overflow-hidden rounded-2xl border-border bg-card/95 shadow-[0_0_40px_rgba(50,65,95,0.15)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(50,65,95,0.25)]"
	>
		<div class="custom-scrollbar overflow-y-auto pt-4 pr-2">
			<div class="mb-6 text-center sm:mb-8">
				<!-- Avatar Section -->
				<div
					role="button"
					tabindex="0"
					class="group relative mx-auto mb-6 flex cursor-pointer justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					onclick={() => profileEditor.handleAvatarClick()}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							profileEditor.handleAvatarClick();
						}
					}}
					aria-label="Change profile picture"
				>
					<UserAvatar
						src={profileEditor.currentAvatar}
						initials={user?.avatarInitials}
						size="lg"
						className="ring-4 ring-border shadow-xl transition-transform duration-300 group-hover:scale-105"
					>
						<!-- Hover Overlay for Upload -->
						<div
							class="absolute inset-0 flex items-center justify-center rounded-full bg-primary/60 opacity-0 transition-all duration-300 group-hover:opacity-100"
						>
							<Camera class="h-6 w-6 text-white sm:h-8 sm:w-8" />
						</div>
					</UserAvatar>

					<!-- Remove Avatar Button -->
					{#if profileEditor.currentAvatar}
						<button
							onclick={(e) => {
								e.stopPropagation();
								profileEditor.removeAvatar();
							}}
							class="absolute right-[calc(50%-3.5rem)] bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-destructive text-destructive-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-destructive/30 sm:h-10 sm:w-10 sm:right-[calc(50%-4rem)]"
							title="Remove Avatar"
							transition:fade
						>
							<Trash2 class="h-4 w-4 sm:h-5 sm:w-5" />
						</button>
					{/if}
				</div>

				<!-- Hidden Input -->
				<input
					type="file"
					accept="image/*"
					class="hidden"
					bind:this={profileEditor.avatar.fileInput}
					onchange={(e) => profileEditor.handleFileChange(e)}
				/>

				<!-- Names -->
				<h1 class="aura m-0 px-2 text-xl leading-tight font-extrabold tracking-tight text-foreground sm:text-3xl">
					{user?.name || ''} {user?.surname || (user?.name ? '' : 'User')}
				</h1>

				<!-- Inline Username Editing -->
				<div class="mt-1 flex items-center justify-center gap-2">
					{#if profileEditor.username.isEditing}
						<div class="group relative flex items-center">
							<span class="absolute left-3 font-medium text-muted-foreground">@</span>
							<Input
								type="text"
								bind:value={profileEditor.username.temp}
								class="w-48 border-none bg-secondary py-1.5 pr-4 pl-8 text-sm font-medium text-secondary-foreground transition-all duration-300 focus-visible:ring-primary/20 sm:text-base"
								autofocus
							/>
						</div>
					{:else}
						<p class="text-sm font-medium text-muted-foreground sm:text-base">@{user?.username}</p>
						<button
							onclick={() => profileEditor.startEditingUsername()}
							class="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
							title="Edit Username"
						>
							<Pencil class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>

			<Card.Content class="space-y-4 sm:space-y-6">
				<!-- Info List -->
				<div class="flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-secondary/50 sm:gap-5">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
						<Mail class="h-5 w-5" />
					</div>
					<div class="flex min-w-0 flex-col">
						<span class="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[10px]">
							Email
						</span>
						<span class="text-sm font-medium break-all text-foreground sm:text-base">{user?.email}</span>
					</div>
				</div>

				<div class="flex items-center gap-3 rounded-xl p-2 transition-all duration-300 hover:bg-secondary/50 sm:gap-5">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
						<Shield class="h-5 w-5" />
					</div>
					<div class="flex min-w-0 flex-col">
						<span class="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase sm:text-[10px]">
							University
						</span>
						<span class="text-sm font-medium text-foreground sm:text-base">{user?.university || 'Transilvania University of Brașov'}</span>
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
						<span class="text-sm font-medium text-foreground sm:text-base">{user?.memberSince}</span>
					</div>
				</div>

				<!-- Appearance Section -->
				<div class="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
					<div class="flex items-center gap-2 px-1">
						<Palette class="h-4 w-4 text-primary" />
						<span class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Appearance</span>
					</div>
					
					<div class="grid grid-cols-5 gap-4 sm:grid-cols-10 sm:gap-6">
						{#each [
							{ id: 'dark', label: 'Dark', color: 'bg-[#0f0f0f]' },
							{ id: 'light', label: 'Light', color: 'bg-white border' },
							{ id: 'midnight', label: 'Midnight', color: 'bg-black border-[#ff000033] border' },
							{ id: 'outpost', label: 'Outpost', color: 'bg-[#1a1a1a] border-[#8b3d1f] border' },
							{ id: 'amethyst', label: 'Amethyst', color: 'bg-[#0f0814] border-[#c084fc66] border' },
							{ id: 'cyberpunk', label: 'Cyberpunk', color: 'bg-[#08090a] border-[#00ffc2] border' },
							{ id: 'cyberpop', label: 'CyberPop', color: 'bg-[#120115] border-[#ff007f] border' },
							{ id: 'sakura', label: 'Tokyo Cloud', color: 'bg-[#ffffff] border-[#ffb7c5] border' },
							{ id: 'nordic', label: 'Nordic', color: 'bg-[#1e293b] border-[#a5d7e8] border' },
							{ id: 'coffee', label: 'Espresso', color: 'bg-[#1a0f0a] border-[#c68642] border' }
						] as theme}
							<button
								onclick={() => themeState.setTheme(theme.id as any)}
								class="group flex flex-col items-center gap-1.5"
								title={theme.label}
							>
								<div 
									class="relative h-10 w-10 rounded-full {theme.color} transition-all duration-300 group-hover:scale-110 sm:h-12 sm:w-12
									{themeState.current === theme.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}"
								>
									{#if themeState.current === theme.id}
										<div class="absolute inset-0 flex items-center justify-center">
											<div class="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
										</div>
									{/if}
								</div>
								<span class="text-[8px] font-bold text-muted-foreground uppercase">{theme.label}</span>
							</button>
						{/each}
					</div>
				</div>

					<!-- Change Password Toggle -->
					{#if !profileEditor.password.isChanging}
						<div class="mt-2 flex justify-center" transition:fade>
							<Button
								variant="outline"
								size="sm"
								onclick={() => profileEditor.togglePasswordForm()}
								class="border-primary/30 bg-primary/5 text-xs font-bold text-primary transition-all duration-300 hover:bg-primary/10 hover:text-primary"
							>
								Change Password
							</Button>
						</div>
					{/if}

					<!-- Change Password Form -->
					{#if profileEditor.password.isChanging}
						<div
							class="mt-2 space-y-4 rounded-2xl border border-border bg-secondary/50 px-4 py-5"
							transition:slide
						>
							<div class="space-y-2">
								<Label class="px-1 text-[10px] font-bold text-muted-foreground uppercase">
									Current Password
								</Label>
								<div class="relative">
									<Input
										type={profileEditor.password.visibility.current ? 'text' : 'password'}
										bind:value={profileEditor.password.current}
										placeholder="••••••••"
										class="pr-10 transition-all duration-300"
									/>
									<button
										onclick={() =>
											(profileEditor.password.visibility.current =
												!profileEditor.password.visibility.current)}
										class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors duration-300 hover:text-foreground"
									>
										{#if profileEditor.password.visibility.current}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>

							<div class="space-y-2">
								<Label class="px-1 text-[10px] font-bold text-muted-foreground uppercase">
									New Password
								</Label>
								<div class="relative">
									<Input
										type={profileEditor.password.visibility.new ? 'text' : 'password'}
										bind:value={profileEditor.password.new}
										placeholder="••••••••"
										class="pr-10 transition-all duration-300"
									/>
									<button
										onclick={() =>
											(profileEditor.password.visibility.new =
												!profileEditor.password.visibility.new)}
										class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors duration-300 hover:text-foreground"
									>
										{#if profileEditor.password.visibility.new}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>

							<div class="space-y-2">
								<Label class="px-1 text-[10px] font-bold text-muted-foreground uppercase">
									Confirm Password
								</Label>
								<div class="relative">
									<Input
										type={profileEditor.password.visibility.confirm ? 'text' : 'password'}
										bind:value={profileEditor.password.confirm}
										placeholder="••••••••"
										class="pr-10 transition-all duration-300"
									/>
									<button
										onclick={() =>
											(profileEditor.password.visibility.confirm =
												!profileEditor.password.visibility.confirm)}
										class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors duration-300 hover:text-foreground"
									>
										{#if profileEditor.password.visibility.confirm}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>
						</div>
					{/if}
			</Card.Content>
		</div>

		<!-- Action Buttons -->
		{#if profileEditor.showActions}
			<div transition:slide>
				<Card.Footer
					class="mt-auto grid grid-cols-2 gap-4 border-t border-border bg-secondary/30 pt-6"
				>
					<Button
						variant="outline"
						onclick={() => profileEditor.discardChanges()}
						class="w-full border-2 border-destructive py-2.5 text-sm font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground sm:py-3 sm:text-base"
					>
						{profileEditor.hasChanges ? 'Discard' : 'Cancel'}
					</Button>
					<Button
						onclick={() => profileEditor.saveChanges()}
						disabled={!profileEditor.hasChanges}
						class="w-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-30 sm:py-3 sm:text-base"
					>
						Save Changes
					</Button>
				</Card.Footer>
			</div>
		{/if}
	</Card.Root>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}



	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}
</style>
