<script lang="ts">
	import { user } from '$lib/stores/user.svelte';
	import { profileEditor } from '$lib/stores/profileEditor.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { slide, fade } from 'svelte/transition';
</script>

<div
	class="flex h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#f8fafc_0%,#f1f5f9_100%)] p-4 sm:p-6"
>
	<div
		class="animate-in fade-in slide-in-from-bottom-2 relative flex max-h-[90vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[24px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-xl duration-700 sm:p-8"
	>
		<div class="custom-scrollbar overflow-y-auto pt-4 pr-2">
			<div class="mb-6 text-center sm:mb-8">
				<!-- Avatar Section -->
				<div
					class="group relative mx-auto mb-6 flex cursor-pointer justify-center"
					onclick={() => profileEditor.handleAvatarClick()}
				>
					<UserAvatar
						src={profileEditor.currentAvatar}
						initials={user.avatarInitials}
						size="lg"
						className="ring-4 ring-white shadow-xl transition-transform duration-300 group-hover:scale-105"
					>
						<!-- Hover Overlay for Upload -->
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="h-6 w-6 sm:h-8 sm:w-8"
								><path
									d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
								/><circle cx="12" cy="13" r="4" /></svg
							>
						</div>
					</UserAvatar>

					<!-- Remove Avatar Button -->
					{#if profileEditor.currentAvatar}
						<button
							onclick={(e) => {
								e.stopPropagation();
								profileEditor.removeAvatar();
							}}
							class="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white shadow-lg transition-transform hover:scale-110 sm:h-10 sm:w-10"
							title="Remove Avatar"
							transition:fade
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
									d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
								/></svg
							>
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
				<h1
					class="m-0 px-2 text-xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-3xl"
				>
					{user.name}
				</h1>
				<h1
					class="m-0 px-2 text-xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-3xl"
				>
					{user.surname}
				</h1>

				<!-- Inline Username Editing -->
				<div class="mt-1 flex items-center justify-center gap-2">
					{#if profileEditor.username.isEditing}
						<div class="group relative flex items-center">
							<span class="absolute left-3 font-medium text-slate-400">@</span>
							<input
								type="text"
								bind:value={profileEditor.username.temp}
								class="w-48 rounded-lg border-none bg-slate-100 py-1.5 pr-4 pl-8 text-sm font-medium text-slate-700 transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-base"
								autofocus
							/>
						</div>
					{:else}
						<p class="text-sm font-medium text-slate-500 sm:text-base">@{user.username}</p>
						<button
							onclick={() => profileEditor.startEditingUsername()}
							class="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
							title="Edit Username"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path
									d="m15 5 4 4"
								/></svg
							>
						</button>
					{/if}
				</div>
			</div>

			<div class="space-y-4 sm:space-y-6">
				<!-- Info List -->
				<div
					class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-black/5 sm:gap-5"
				>
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 sm:h-11 sm:w-11"
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
							><rect width="20" height="16" x="2" y="4" rx="2" /><path
								d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
							/></svg
						>
					</div>
					<div class="flex min-w-0 flex-col">
						<span
							class="text-[9px] font-semibold tracking-wider text-slate-400 uppercase sm:text-[10px]"
							>Email</span
						>
						<span class="text-sm font-medium break-all text-slate-700 sm:text-base"
							>{user.email}</span
						>
					</div>
				</div>

				<div
					class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-black/5 sm:gap-5"
				>
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 sm:h-11 sm:w-11"
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
							stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg
						>
					</div>
					<div class="flex min-w-0 flex-col">
						<span
							class="text-[9px] font-semibold tracking-wider text-slate-400 uppercase sm:text-[10px]"
							>University</span
						>
						<span class="text-sm font-medium text-slate-700 sm:text-base">{user.university}</span>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<div
						class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-black/5 sm:gap-5"
					>
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 sm:h-11 sm:w-11"
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
								><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line
									x1="16"
									x2="16"
									y1="2"
									y2="6"
								/><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg
							>
						</div>
						<div class="flex min-w-0 flex-col">
							<span
								class="text-[9px] font-semibold tracking-wider text-slate-400 uppercase sm:text-[10px]"
								>Member Since</span
							>
							<span class="text-sm font-medium text-slate-700 sm:text-base">{user.memberSince}</span
							>
						</div>
					</div>

					<!-- Change Password Toggle -->
					{#if !profileEditor.password.isChanging}
						<div class="mt-2 flex justify-center" transition:fade>
							<button
								onclick={() => profileEditor.togglePasswordForm()}
								class="cursor-pointer rounded-lg border border-indigo-100 bg-indigo-50/30 px-4 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
							>
								Change Password
							</button>
						</div>
					{/if}

					<!-- Change Password Form -->
					{#if profileEditor.password.isChanging}
						<div
							class="mt-2 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-5"
							transition:slide
						>
							<div class="space-y-1">
								<label class="px-1 text-[10px] font-bold text-slate-400 uppercase"
									>Current Password</label
								>
								<div class="relative">
									<input
										type={profileEditor.password.visibility.current ? 'text' : 'password'}
										bind:value={profileEditor.password.current}
										placeholder="••••••••"
										class="w-full rounded-xl border border-slate-200 bg-white py-2 pr-10 pl-3 text-sm transition-all outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5"
									/>
									<button
										onclick={() =>
											(profileEditor.password.visibility.current =
												!profileEditor.password.visibility.current)}
										class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-indigo-600"
									>
										{#if profileEditor.password.visibility.current}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path
													d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
												/><path
													d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
												/><line x1="2" x2="22" y1="2" y2="22" /></svg
											>
										{:else}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle
													cx="12"
													cy="12"
													r="3"
												/></svg
											>
										{/if}
									</button>
								</div>
							</div>

							<div class="space-y-1">
								<label class="px-1 text-[10px] font-bold text-slate-400 uppercase"
									>New Password</label
								>
								<div class="relative">
									<input
										type={profileEditor.password.visibility.new ? 'text' : 'password'}
										bind:value={profileEditor.password.new}
										placeholder="••••••••"
										class="w-full rounded-xl border border-slate-200 bg-white py-2 pr-10 pl-3 text-sm transition-all outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5"
									/>
									<button
										onclick={() =>
											(profileEditor.password.visibility.new =
												!profileEditor.password.visibility.new)}
										class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-indigo-600"
									>
										{#if profileEditor.password.visibility.new}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path
													d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
												/><path
													d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
												/><line x1="2" x2="22" y1="2" y2="22" /></svg
											>
										{:else}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle
													cx="12"
													cy="12"
													r="3"
												/></svg
											>
										{/if}
									</button>
								</div>
							</div>

							<div class="space-y-1">
								<label class="px-1 text-[10px] font-bold text-slate-400 uppercase"
									>Confirm Password</label
								>
								<div class="relative">
									<input
										type={profileEditor.password.visibility.confirm ? 'text' : 'password'}
										bind:value={profileEditor.password.confirm}
										placeholder="••••••••"
										class="w-full rounded-xl border border-slate-200 bg-white py-2 pr-10 pl-3 text-sm transition-all outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5"
									/>
									<button
										onclick={() =>
											(profileEditor.password.visibility.confirm =
												!profileEditor.password.visibility.confirm)}
										class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-indigo-600"
									>
										{#if profileEditor.password.visibility.confirm}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path
													d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
												/><path
													d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
												/><line x1="2" x2="22" y1="2" y2="22" /></svg
											>
										{:else}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle
													cx="12"
													cy="12"
													r="3"
												/></svg
											>
										{/if}
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		{#if profileEditor.showActions}
			<div
				class="mt-auto grid grid-cols-2 gap-4 border-t border-slate-100 bg-white/50 pt-6"
				transition:slide
			>
				<button
					onclick={() => profileEditor.discardChanges()}
					class="w-full cursor-pointer rounded-xl border-2 border-red-500 py-2.5 text-sm font-bold text-red-500 transition-all duration-200 hover:bg-red-500 hover:text-white sm:py-3 sm:text-base"
				>
					{profileEditor.hasChanges ? 'Discard' : 'Cancel'}
				</button>
				<button
					onclick={() => profileEditor.saveChanges()}
					disabled={!profileEditor.hasChanges}
					class="w-full cursor-pointer rounded-xl border-2 border-green-500 py-2.5 text-sm font-bold text-green-500 transition-all duration-200 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-green-500 sm:py-3 sm:text-base"
				>
					Save Changes
				</button>
			</div>
		{/if}
	</div>
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

	.animate-in {
		animation: fadeIn 0.6s ease-out forwards;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #e2e8f0;
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #cbd5e1;
	}
</style>
