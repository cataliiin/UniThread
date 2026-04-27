<section class="h-screen flex items-center justify-center bg-slate-950">
	<div class="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl w-full max-w-md">
		<div class="flex flex-col items-center mb-8">
			<div class="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
			</div>
			<h1 class="text-2xl font-bold text-white">Login to UniThread</h1>
			<p class="text-slate-400">Enter your credentials to continue</p>
		</div>

		<form class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-slate-300 mb-1">Email</label>
				<input type="email" id="email" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="name.surname@unitbv.ro" />
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-slate-300 mb-1">Password</label>
				<input type="password" id="password" class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" />
			</div>
			<button type="button" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-[0.98]">
				Sign In
			</button>
		</form>
	</div>
</section>
