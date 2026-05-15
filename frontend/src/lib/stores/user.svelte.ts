import { AuthService, StorageService, UsersService } from '$lib/api/services';
import type { components } from '$lib/api/openapi-generated-schema';

type UserResponse = components['schemas']['UserResponse'];

const isAbsoluteUrl = (value: string): boolean =>
	value.startsWith('http://') ||
	value.startsWith('https://') ||
	value.startsWith('data:') ||
	value.startsWith('blob:');

const resolveAvatarSource = (value: string | null): string | null => {
	if (!value) return null;
	if (value.startsWith('local_img_')) {
		return typeof window !== 'undefined' ? localStorage.getItem(value) : null;
	}
	if (isAbsoluteUrl(value)) return value;
	return StorageService.getPublicUrl('user-assets', value);
};

function createUserState() {
	let userData = $state<UserResponse | null>(null);
	let isAuthenticated = $state(false);

	// Initialize from localStorage
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('currentUser');
		if (saved) {
			try {
				const data = JSON.parse(saved);
				userData = data as UserResponse;
				isAuthenticated = true;
			} catch (e) {
				console.error('Failed to parse user data from localStorage');
			}
		}

		// Reset in-memory state when the API client detects an expired/invalid token
		window.addEventListener('auth:expired', () => logout());
	}

	let avatarSource = $derived.by(() => resolveAvatarSource(userData?.avatar_key || null));

	function updateProfileStorage() {
		if (typeof window !== 'undefined' && isAuthenticated && userData) {
			localStorage.setItem('currentUser', JSON.stringify(userData));
			localStorage.setItem('currentUserId', userData.id);
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
			userData = me;
			isAuthenticated = true;

			updateProfileStorage();

			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message || 'Login failed.' };
		}
	}

	function logout() {
		userData = null;
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
		});

		const loginResult = await login(emailParam, password);
		if (!loginResult.success) {
			throw new Error(loginResult.error);
		}
	}

	return {
		get id() { return userData?.id || ''; },
		get name() { return userData?.first_name || ''; },
		get surname() { return userData?.last_name || ''; },
		get username() { return userData?.username || ''; },
		set username(val: string) {
			if (userData) {
				userData.username = val;
				updateProfileStorage();
			}
		},
		get email() { return userData?.email || ''; },
		get university() { return 'Transilvania University of Brașov'; },
		get memberSince() { 
			return userData 
				? new Date(userData.created_at).toLocaleString('en-US', { month: 'long', year: 'numeric' })
				: ''; 
		},
		get avatarInitials() { 
			if (!userData) return '';
			const first = userData.first_name || '';
			const last = userData.last_name || '';
			if (first && last) return (first[0] + last[0]).toUpperCase();
			return userData.username.substring(0, 2).toUpperCase();
		},
		get avatarUrl() { return userData?.avatar_key || null; },
		set avatarUrl(val: string | null) {
			if (userData) {
				userData.avatar_key = val;
				updateProfileStorage();
			}
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
