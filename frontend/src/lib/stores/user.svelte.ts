function createUserState() {
	let name = $state('');
	let username = $state('');
	let email = $state('');
	let university = $state('');
	let memberSince = $state('');
	let avatarInitials = $state('');
	let avatarUrl = $state<string | null>(null);
	let isAuthenticated = $state(false);

	// Initialize from localStorage
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('currentUser');
		if (saved) {
			try {
				const data = JSON.parse(saved);
				name = data.name || '';
				username = data.username || '';
				email = data.email || '';
				university = data.university || '';
				memberSince = data.memberSince || '';
				avatarInitials = data.avatarInitials || '';
				avatarUrl = data.avatarUrl || null;
				isAuthenticated = data.isAuthenticated || false;
			} catch (e) {
				console.error('Failed to parse user data from localStorage');
			}
		}
	}

	let avatarSource = $derived(avatarUrl);

	async function checkUsername(usernameParam: string): Promise<boolean> {
		await new Promise((resolve) => setTimeout(resolve, 500));
		if (localStorage.getItem('username_' + usernameParam) === usernameParam) {
			return false;
		}
		return true;
	}

	async function checkEmail(emailParam: string): Promise<boolean> {
		await new Promise((resolve) => setTimeout(resolve, 500));
		if (localStorage.getItem('email_' + emailParam) === emailParam) {
			return false;
		}
		return true;
	}

	async function login(emailParam: string, password: string): Promise<{ success: boolean; error?: string }> {
		await new Promise((resolve) => setTimeout(resolve, 800));

		if (typeof window === 'undefined') return { success: false, error: 'Not available server-side' };

		const storedEmail = localStorage.getItem('email_' + emailParam);
		if (storedEmail !== emailParam) {
			return { success: false, error: 'No account found with this email address.' };
		}

		const storedPassword = localStorage.getItem('password_' + emailParam);
		if (storedPassword !== password) {
			return { success: false, error: 'Incorrect password. Please try again.' };
		}

		const profileRaw = localStorage.getItem('profile_' + emailParam);
		if (!profileRaw) {
			return { success: false, error: 'User profile not found.' };
		}

		const profile = JSON.parse(profileRaw);
		name = profile.name || '';
		username = profile.username || '';
		email = profile.emailParam || '';
		university = profile.university || '';
		memberSince = profile.memberSince || '';
		avatarInitials = profile.avatarInitials || '';
		avatarUrl = profile.avatarUrl || null;
		isAuthenticated = true;

		localStorage.setItem('currentUser', JSON.stringify({
			name,
			username,
			email,
			university,
			memberSince,
			avatarInitials,
			avatarUrl,
			isAuthenticated: true
		}));

		return { success: true };
	}

	function logout() {
		name = '';
		username = '';
		email = '';
		university = '';
		memberSince = '';
		avatarInitials = '';
		avatarUrl = null;
		isAuthenticated = false;
		if (typeof window !== 'undefined') {
			localStorage.removeItem('currentUser');
		}
	}

	async function register(emailParam: string, usernameParam: string, password: string): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 1500));

		email = emailParam;
		username = usernameParam;
		name = usernameParam;
		university = 'Transilvania University of Brașov';

		const date = new Date();
		memberSince = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
		avatarInitials = usernameParam.substring(0, 2).toUpperCase();
		isAuthenticated = true;

		if (typeof window !== 'undefined') {
			localStorage.setItem('username_' + usernameParam, usernameParam);
			localStorage.setItem('email_' + emailParam, emailParam);
			localStorage.setItem('password_' + emailParam, password);

			const profile = {
				name,
				username,
				email,
				university,
				memberSince,
				avatarInitials,
				avatarUrl
			};
			localStorage.setItem('profile_' + emailParam, JSON.stringify(profile));

			localStorage.setItem('currentUser', JSON.stringify({
				...profile,
				isAuthenticated: true
			}));
		}
	}

	return {
		get name() { return name; },
		get username() { return username; },
		get email() { return email; },
		get university() { return university; },
		get memberSince() { return memberSince; },
		get avatarInitials() { return avatarInitials; },
		get avatarUrl() { return avatarUrl; },
		get avatarSource() { return avatarSource; },
		get isAuthenticated() { return isAuthenticated; },
		checkUsername,
		checkEmail,
		login,
		logout,
		register
	};
}

export const user = createUserState();
