<script lang="ts">
	import { user } from '$lib/stores/user.svelte';
	import { slide, fade } from 'svelte/transition';
	
	let fileInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);
	let isEditingUsername = $state(false);
	let tempUsername = $state(user.username);
	
	let currentAvatar = $derived(previewUrl || user.avatarUrl);
	let showActions = $derived(previewUrl !== null || isEditingUsername);

	function handleAvatarClick() {
		fileInput.click();
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			previewUrl = URL.createObjectURL(file);
		}
	}

	function startEditingUsername() {
		tempUsername = user.username;
		isEditingUsername = true;
	}

	function saveChanges() {
		if (previewUrl) {
			user.avatarUrl = previewUrl;
			previewUrl = null;
		}
		if (isEditingUsername) {
			user.username = tempUsername;
			isEditingUsername = false;
		}
	}

	function discardChanges() {
		previewUrl = null;
		if (fileInput) fileInput.value = '';
		isEditingUsername = false;
		tempUsername = user.username;
	}
</script>

<div class="h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(circle_at_top_left,#f8fafc_0%,#f1f5f9_100%)] overflow-hidden">
	<div class="w-full max-w-[440px] bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/50 shadow-[0_20px_40px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-6 sm:p-10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700 flex flex-col">
		<div class="text-center mb-6 sm:mb-8">
			<!-- Avatar Section -->
			<div class="relative w-20 h-20 sm:w-[100px] sm:h-[100px] mx-auto mb-4 sm:mb-5 flex items-center justify-center group cursor-pointer" onclick={handleAvatarClick}>
				<div class="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-[0_10px_20px_rgba(79,70,229,0.2)] transition-transform duration-300 group-hover:scale-105"></div>
				
				<div class="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
					{#if currentAvatar}
						<img src={currentAvatar} alt="Avatar" class="w-full h-full object-cover [transform:translateZ(0)] [backface-visibility:hidden]" />
					{:else}
						<div class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
							{user.avatarInitials}
						</div>
					{/if}
					
					<!-- Hover Overlay -->
					<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 sm:w-8 sm:h-8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
					</div>
				</div>

				<!-- Hidden Input -->
				<input 
					type="file" 
					accept="image/*" 
					class="hidden" 
					bind:this={fileInput} 
					onchange={handleFileChange}
				/>
			</div>
			
			<!-- Names -->
			<h1 class="text-xl sm:text-3xl font-extrabold text-slate-900 m-0 tracking-tight leading-tight px-2">{user.name}</h1>
			
			<!-- Inline Username Editing -->
			<div class="flex items-center justify-center gap-2 mt-1">
				{#if isEditingUsername}
					<div class="relative flex items-center group">
						<span class="absolute left-3 text-slate-400 font-medium">@</span>
						<input 
							type="text" 
							bind:value={tempUsername} 
							class="pl-8 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-slate-700 font-medium text-sm sm:text-base focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all w-48"
							autoFocus
						/>
					</div>
				{:else}
					<p class="text-slate-500 text-sm sm:text-base font-medium">@{user.username}</p>
					<button 
						onclick={startEditingUsername}
						class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
						title="Edit Username"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
					</button>
				{/if}
			</div>
		</div>
		
		<div class="space-y-4 sm:space-y-6 flex-1">
			<!-- Info List -->
			<div class="flex items-center gap-3 sm:gap-5 p-2 rounded-xl transition-colors hover:bg-black/5">
				<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-slate-100 text-indigo-600 shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</span>
					<span class="text-sm sm:text-base text-slate-700 font-medium break-all">{user.email}</span>
				</div>
			</div>
			
			<div class="flex items-center gap-3 sm:gap-5 p-2 rounded-xl transition-colors hover:bg-black/5">
				<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-slate-100 text-indigo-600 shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">University</span>
					<span class="text-sm sm:text-base text-slate-700 font-medium">{user.university}</span>
				</div>
			</div>
			
			<div class="flex items-center gap-3 sm:gap-5 p-2 rounded-xl transition-colors hover:bg-black/5">
				<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-slate-100 text-indigo-600 shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Member Since</span>
					<span class="text-sm sm:text-base text-slate-700 font-medium">{user.memberSince}</span>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		{#if showActions}
			<div class="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 grid grid-cols-2 gap-4" transition:slide>
				<button 
					onclick={discardChanges}
					class="w-full py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
				>
					Discard
				</button>
				<button 
					onclick={saveChanges}
					class="w-full py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200"
				>
					Save Changes
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	:global(.animate-in) {
		animation: fadeIn 0.6s ease-out forwards;
	}
</style>