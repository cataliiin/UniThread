import { user } from './user.svelte';
import { toasts } from './toast.svelte';

class ProfileEditor {
	avatar = $state({
		previewUrl: null as string | null,
		fileInput: null as HTMLInputElement | null,
		shouldRemove: false
	});

	username = $state({
		isEditing: false,
		temp: user.username
	});

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

	currentAvatar = $derived(
		this.avatar.shouldRemove ? null : this.avatar.previewUrl || user.avatarUrl
	);
	showActions = $derived(
		this.avatar.previewUrl !== null ||
			this.avatar.shouldRemove ||
			this.username.isEditing ||
			this.password.isChanging
	);
	hasChanges = $derived(
		this.avatar.previewUrl !== null ||
			this.avatar.shouldRemove ||
			(this.username.isEditing && this.username.temp !== user.username) ||
			(this.password.isChanging &&
				(this.password.current !== '' || this.password.new !== '' || this.password.confirm !== ''))
	);

	handleAvatarClick() {
		this.avatar.fileInput?.click();
	}

	handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			this.avatar.previewUrl = URL.createObjectURL(file);
			this.avatar.shouldRemove = false;
		}
	}

	removeAvatar() {
		this.avatar.previewUrl = null;
		this.avatar.shouldRemove = true;
		if (this.avatar.fileInput) this.avatar.fileInput.value = '';
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

	async saveChanges() {
		const updatedFields: string[] = [];
		const hasAvatarChange = this.avatar.previewUrl !== null || this.avatar.shouldRemove;
		const hasUsernameChange = this.username.isEditing && this.username.temp !== user.username;

		// Check if password form is active AND has any input
		const isPasswordInputPresent =
			this.password.current !== '' || this.password.new !== '' || this.password.confirm !== '';
		const shouldValidatePassword = this.password.isChanging && isPasswordInputPresent;

		if (shouldValidatePassword) {
			if (this.password.new === this.password.current) {
				toasts.show('New password cannot be the same as the current one!', 'error');
				return;
			}
			if (this.password.new !== this.password.confirm || this.password.new === '') {
				toasts.show('Passwords do not match or are empty!', 'error');
				return;
			}
		}

		if (hasAvatarChange) {
			if (this.avatar.shouldRemove) {
				user.avatarUrl = null;
			} else if (this.avatar.previewUrl) {
				try {
					const response = await fetch(this.avatar.previewUrl);
					const blob = await response.blob();
					const base64 = await new Promise<string>((resolve) => {
						const reader = new FileReader();
						reader.onloadend = () => resolve(reader.result as string);
						reader.readAsDataURL(blob);
					});
					user.avatarUrl = base64;
				} catch {
					user.avatarUrl = this.avatar.previewUrl;
				}
			}
			this.avatar.previewUrl = null;
			this.avatar.shouldRemove = false;
			updatedFields.push('Avatar');
		}

		if (this.username.isEditing) {
			if (hasUsernameChange) {
				user.username = this.username.temp;
				updatedFields.push('Username');
			}
			this.username.isEditing = false;
		}

		if (this.password.isChanging) {
			if (isPasswordInputPresent) {
				updatedFields.push('Password');
			}
			this.password.isChanging = false;
			this.resetPasswordFields();
		}

		if (updatedFields.length > 0) {
			toasts.show(`${updatedFields.join(', ')} updated successfully!`, 'success');
		}
	}

	discardChanges() {
		this.avatar.previewUrl = null;
		this.avatar.shouldRemove = false;
		if (this.avatar.fileInput) this.avatar.fileInput.value = '';
		this.username.isEditing = false;
		this.username.temp = user.username;
		this.password.isChanging = false;
		this.resetPasswordFields();
		toasts.show('Changes discarded', 'info');
	}
}

export const profileEditor = new ProfileEditor();
