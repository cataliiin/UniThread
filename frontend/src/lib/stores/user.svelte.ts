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

	async checkUsername(username: string): Promise<boolean> {
		// Simulate API call to check username availability
		await new Promise((resolve) => setTimeout(resolve, 500));

		if (localStorage.getItem(username) === username) {
			return false;
		}
		return true;
	}

	async checkEmail(email: string): Promise<boolean> {
		// Simulate API call to check email availability
		await new Promise((resolve) => setTimeout(resolve, 500));

		if (localStorage.getItem(email) === email) {
			return false;
		}
		return true;
	}

	async register(email: string, username: string): Promise<void> {
		localStorage.setItem(username, username);
		localStorage.setItem(email, email);
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));

		this.email = email;
		this.username = username;
		this.name = username; // Can be updated later
		this.isAuthenticated = true;
	}
}

export const user = new UserState();
