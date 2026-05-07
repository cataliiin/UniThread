import { AuthService, UsersService } from '$lib/api/services';

function createUserState() {
	let id = $state('');
	let name = $state('');
	let surname = $state('');
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
				id = data.id || '';
				name = data.name || '';
				surname = data.surname || '';
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

		// Reset in-memory state when the API client detects an expired/invalid token
		window.addEventListener('auth:expired', () => logout());
	}

	let avatarSource = $derived(avatarUrl);

	function updateProfileStorage() {
		if (typeof window !== 'undefined' && isAuthenticated) {
			const profile = { id, name, surname, username, email, university, memberSince, avatarInitials, avatarUrl };
			localStorage.setItem('profile_' + email, JSON.stringify(profile));
			localStorage.setItem('currentUser', JSON.stringify({ ...profile, isAuthenticated: true }));
		}
	}

	async function checkUsername(usernameParam: string): Promise<boolean> {
		// Mock implementation or future API check
		return true;
	}

	async function checkEmail(emailParam: string): Promise<boolean> {
		// Mock implementation or future API check
		return true;
	}

	async function login(emailParam: string, password: string): Promise<{ success: boolean; error?: string }> {
		if (typeof window === 'undefined') return { success: false, error: 'Not available server-side' };

		try {
			const tokenData = await AuthService.login({ username: emailParam, password });
			if (typeof window !== 'undefined') {
				localStorage.setItem('token', tokenData.access_token);
			}
			const me = await UsersService.getMe();
			id = me.id;
			username = me.username;
			email = me.email;
			memberSince = new Date(me.created_at).toLocaleString('en-US', { month: 'long', year: 'numeric' });
			avatarInitials = me.username.substring(0, 2).toUpperCase();
			avatarUrl = me.avatar_key;
			isAuthenticated = true;

			updateProfileStorage();

			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message || 'Login failed.' };
		}
	}

	function logout() {
		id = '';
		name = '';
		surname = '';
		username = '';
		email = '';
		university = '';
		memberSince = '';
		avatarInitials = '';
		avatarUrl = null;
		isAuthenticated = false;
		if (typeof window !== 'undefined') {
			localStorage.removeItem('currentUser');
			localStorage.removeItem('token');
		}
	}

	async function register(emailParam: string, usernameParam: string, password: string,
		nameParam: string, surnameParam: string): Promise<void> {

		await AuthService.register({
			email: emailParam,
			username: usernameParam,
			password: password
		});

		name = nameParam;
		surname = surnameParam;
		university = 'Transilvania University of Brașov';

		const loginResult = await login(emailParam, password);
		if (!loginResult.success) {
			throw new Error(loginResult.error);
		}
	}

	return {
		get id() { return id; },
		get name() { return name; },
		get surname() { return surname; },
		get username() { return username; },
		set username(val: string) {
			username = val;
			updateProfileStorage();
		},
		get email() { return email; },
		get university() { return university; },
		get memberSince() { return memberSince; },
		get avatarInitials() { return avatarInitials; },
		get avatarUrl() { return avatarUrl; },
		set avatarUrl(val: string | null) {
			avatarUrl = val;
			updateProfileStorage();
		},
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
