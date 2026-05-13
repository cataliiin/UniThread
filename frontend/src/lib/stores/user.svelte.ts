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
				// Migration: if id is an email, it's legacy/invalid, clear it
				if (data.id && data.id.includes('@')) {
					localStorage.removeItem('currentUser');
					localStorage.removeItem('token');
					if (typeof window !== 'undefined') window.location.reload();
				} else {				
				id = data.id || '';
				name = data.name || '';
				surname = data.surname || '';
				username = data.username || '';
				email = data.email || '';
				
				// Prioritize database fields
				if (data.first_name || data.last_name) {
					name = data.first_name || '';
					surname = data.last_name || '';
				} else if (email && email.includes('.') && (!name || !surname)) {
					// Fallback name parsing from email (e.g. cezar.mihai.vieru@...)
					const parts = email.split('@')[0].split('.');
					if (parts.length >= 2) {
						if (!name) name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
						if (!surname) {
							surname = parts.slice(1)
								.map(p => p.charAt(0).toUpperCase() + p.slice(1))
								.join(' ');
						}
					}
				}
				university = data.university || '';
				memberSince = data.memberSince || '';
				avatarInitials = data.avatarInitials || '';
				avatarUrl = data.avatarUrl || null;
				isAuthenticated = data.isAuthenticated || false;
				}
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
			localStorage.setItem('currentUser', JSON.stringify({ ...profile, isAuthenticated: true }));
			localStorage.setItem('currentUserId', id);
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

			// Prioritize database fields from backend
			const userData = me as any;
			// Check for both snake_case and camelCase just in case
			const dbFirstName = userData.first_name || userData.firstName;
			const dbLastName = userData.last_name || userData.lastName;
			
			if (dbFirstName || dbLastName) {
				name = dbFirstName || '';
				surname = dbLastName || '';
			} else if (me.email.includes('.')) {
				// Fallback: Parse name and surname from email if possible
				const parts = me.email.split('@')[0].split('.');
				if (parts.length >= 2) {
					name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
					surname = parts.slice(1)
						.map(p => p.charAt(0).toUpperCase() + p.slice(1))
						.join(' ');
				}
			}
			
			// Fallback for university name if not in schema yet
			university = 'Transilvania University of Brașov'; 
			memberSince = new Date(me.created_at).toLocaleString('en-US', { month: 'long', year: 'numeric' });
			
			// Calculate initials from name/surname if available, else username
			if (name && surname) {
				avatarInitials = (name[0] + surname[surname.indexOf(' ') + 1] || surname[0]).toUpperCase();
			} else {
				avatarInitials = me.username.substring(0, 2).toUpperCase();
			}
			
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
			localStorage.removeItem('currentUserId');
			localStorage.removeItem('token');
		}
	}

	async function register(emailParam: string, usernameParam: string, password: string,
		nameParam: string, surnameParam: string): Promise<void> {

		await AuthService.register({
			email: emailParam,
			username: usernameParam,
			password: password,
			first_name: nameParam,
			last_name: surnameParam
		} as any);

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
