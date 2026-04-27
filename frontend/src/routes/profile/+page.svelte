<script lang="ts">
	import { user } from '$lib/stores/user';
</script>

<div class="h-screen flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(circle_at_top_left,#f8fafc_0%,#f1f5f9_100%)] overflow-hidden">
	<div class="w-full max-w-[440px] bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/50 shadow-[0_20px_40px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] p-6 sm:p-10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
		<div class="text-center mb-6 sm:mb-8">
			<!-- Avatar -->
			<div class="relative w-20 h-20 sm:w-[100px] sm:h-[100px] mx-auto mb-4 sm:mb-5 flex items-center justify-center group">
				<div class="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-[0_10px_20px_rgba(79,70,229,0.2)] transition-transform duration-300 group-hover:scale-105"></div>
				<div class="relative text-2xl sm:text-3xl font-bold text-white tracking-tight">
					{$user.avatarInitials}
				</div>
			</div>
			
			<!-- Names -->
			<h1 class="text-xl sm:text-3xl font-extrabold text-slate-900 m-0 tracking-tight leading-tight px-2">{$user.name}</h1>
			<p class="text-slate-500 text-sm sm:text-base mt-1 font-medium">@{$user.username}</p>
		</div>
		
		<div class="space-y-4 sm:space-y-6">
			<!-- Info List -->
			<div class="flex items-center gap-3 sm:gap-5 p-2 rounded-xl transition-colors hover:bg-black/5">
				<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-slate-100 text-indigo-600 shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email</span>
					<span class="text-sm sm:text-base text-slate-700 font-medium break-all">{$user.email}</span>
				</div>
			</div>
			
			<div class="flex items-center gap-3 sm:gap-5 p-2 rounded-xl transition-colors hover:bg-black/5">
				<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-slate-100 text-indigo-600 shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">University</span>
					<span class="text-sm sm:text-base text-slate-700 font-medium">{$user.university}</span>
				</div>
			</div>
			
			<div class="flex items-center gap-3 sm:gap-5 p-2 rounded-xl transition-colors hover:bg-black/5">
				<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-slate-100 text-indigo-600 shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Member Since</span>
					<span class="text-sm sm:text-base text-slate-700 font-medium">{$user.memberSince}</span>
				</div>
			</div>
		</div>
		
		<div class="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 flex justify-center">
			<button class="bg-indigo-600 text-white border-none py-2.5 sm:py-3.5 px-8 sm:px-10 rounded-xl font-semibold text-sm sm:text-[15px] cursor-pointer transition-all duration-200 shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0">
				Edit Profile
			</button>
		</div>
	</div>
</div>

<style>
	/* Using Tailwind's animation utility classes above, but defining keyframes if not present in tailwind config */
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	:global(.animate-in) {
		animation: fadeIn 0.6s ease-out forwards;
	}
</style>