import { user } from './user.svelte';
import { toasts } from './toast.svelte';

class ProfileEditor {
	// 1. Avatar State
	avatar = $state({
		previewUrl: null as string | null,
		fileInput: null as HTMLInputElement | null
	});

	// 2. Username State
	username = $state({
		isEditing: false,
		temp: user.username
	});

	// 3. Password State
	password = $state({
		isChanging: false,
		current: '',
		new: '',
		confirm: '',
		visibility: {
			current: false,
			new: false,
			confirm: false
		}
	});

	// --- Derived Properties ---
	
	currentAvatar = $derived(this.avatar.previewUrl || user.avatarUrl);
	
	showActions = $derived(
		this.avatar.previewUrl !== null || 
		this.username.isEditing || 
		this.password.isChanging
	);

	hasChanges = $derived(
		this.avatar.previewUrl !== null ||
		(this.username.isEditing && this.username.temp !== user.username) ||
		(this.password.isChanging && (this.password.current !== '' || this.password.new !== '' || this.password.confirm !== ''))
	);

	// --- Actions ---

	handleAvatarClick() {
		this.avatar.fileInput?.click();
	}

	handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			this.avatar.previewUrl = URL.createObjectURL(file);
		}
	}

	startEditingUsername() {
		this.username.temp = user.username;
		this.username.isEditing = true;
	}

	togglePasswordForm() {
		this.password.isChanging = !this.password.isChanging;
		if (!this.password.isChanging) {
			this.resetPasswordFields();
		}
	}

	private resetPasswordFields() {
		this.password.current = '';
		this.password.new = '';
		this.password.confirm = '';
		this.password.visibility.current = false;
		this.password.visibility.new = false;
		this.password.visibility.confirm = false;
	}

	saveChanges() {
		let updatedFields: string[] = [];

		// Handle Avatar
		if (this.avatar.previewUrl) {
			user.avatarUrl = this.avatar.previewUrl;
			this.avatar.previewUrl = null;
			updatedFields.push('Avatar');
		}

		// Handle Username
		if (this.username.isEditing) {
			if (this.username.temp !== user.username) {
				user.username = this.username.temp;
				updatedFields.push('Username');
			}
			this.username.isEditing = false;
		}

		// Handle Password
		if (this.password.isChanging) {
			if (this.password.new === this.password.current) {
				toasts.show('New password cannot be the same as the current one!', 'error');
				return;
			}
			if (this.password.new === this.password.confirm && this.password.new !== '') {
				this.password.isChanging = false;
				this.resetPasswordFields();
				updatedFields.push('Password');
			} else {
				toasts.show('Passwords do not match or are empty!', 'error');
				return;
			}
		}

		if (updatedFields.length > 0) {
			toasts.show(`${updatedFields.join(', ')} updated successfully!`, 'success');
		}
	}

	discardChanges() {
		this.avatar.previewUrl = null;
		if (this.avatar.fileInput) this.avatar.fileInput.value = '';
		this.username.isEditing = false;
		this.username.temp = user.username;
		this.password.isChanging = false;
		this.resetPasswordFields();
		toasts.show('Changes discarded', 'info');
	}
}

export const profileEditor = new ProfileEditor();
