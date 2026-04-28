class UserState {
	name = $state('');
	username = $state('');
	email = $state('');
	university = $state('');
	memberSince = $state('');
	avatarInitials = $state('');
	avatarUrl = $state<string | null>(null);
	avatarSource = $derived(this.avatarUrl);
	isAuthenticated = $state(false);

	constructor() {
		// Load from localStorage if available (client-side only)
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('currentUser');
			if (saved) {
				try {
					const data = JSON.parse(saved);
					this.name = data.name || '';
					this.username = data.username || '';
					this.email = data.email || '';
					this.university = data.university || '';
					this.memberSince = data.memberSince || '';
					this.avatarInitials = data.avatarInitials || '';
					this.avatarUrl = data.avatarUrl || null;
					this.isAuthenticated = data.isAuthenticated || false;
				} catch (e) {
					console.error('Failed to parse user data from localStorage');
				}
			}
		}
	}

	async checkUsername(username: string): Promise<boolean> {
		// Simulate API call to check username availability
		await new Promise((resolve) => setTimeout(resolve, 500));

		if (localStorage.getItem('username_' + username) === username) {
			return false;
		}
		return true;
	}

	async checkEmail(email: string): Promise<boolean> {
		// Simulate API call to check email availability
		await new Promise((resolve) => setTimeout(resolve, 500));

		if (localStorage.getItem('email_' + email) === email) {
			return false;
		}
		return true;
	}

	async register(email: string, username: string): Promise<void> {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));

		this.email = email;
		this.username = username;
		this.name = username; // Can be updated later
		this.university = 'Transilvania University of Brașov';

		const date = new Date();
		this.memberSince = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
		this.avatarInitials = username.substring(0, 2).toUpperCase();
		this.isAuthenticated = true;

		if (typeof window !== 'undefined') {
			// Save availability checks
			localStorage.setItem('username_' + username, username);
			localStorage.setItem('email_' + email, email);

			// Save current user session
			localStorage.setItem('currentUser', JSON.stringify({
				name: this.name,
				username: this.username,
				email: this.email,
				university: this.university,
				memberSince: this.memberSince,
				avatarInitials: this.avatarInitials,
				avatarUrl: this.avatarUrl,
				isAuthenticated: this.isAuthenticated
			}));
		}
	}
}

export const user = new UserState();
