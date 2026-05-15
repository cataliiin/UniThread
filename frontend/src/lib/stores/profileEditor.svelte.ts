import { user } from './user.svelte';
import { toasts } from './toast.svelte';
import { StorageService, UsersService } from '$lib/api/services';

class ProfileEditor {
	avatar = $state({
		previewUrl: null as string | null,
		fileInput: null as HTMLInputElement | null,
		file: null as File | null,
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
		this.avatar.shouldRemove ? null : this.avatar.previewUrl || user.avatarSource
	);
	showActions = $derived(
		this.avatar.file !== null ||
		this.avatar.previewUrl !== null ||
			this.avatar.shouldRemove ||
			this.username.isEditing ||
			this.password.isChanging
	);
	hasChanges = $derived(
		this.avatar.file !== null ||
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
			if (this.avatar.previewUrl?.startsWith('blob:')) {
				URL.revokeObjectURL(this.avatar.previewUrl);
			}
			this.avatar.previewUrl = URL.createObjectURL(file);
			this.avatar.file = file;
			this.avatar.shouldRemove = false;
		}
	}

	removeAvatar() {
		if (this.avatar.previewUrl?.startsWith('blob:')) {
			URL.revokeObjectURL(this.avatar.previewUrl);
		}
		this.avatar.previewUrl = null;
		this.avatar.file = null;
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
		const hasAvatarChange = this.avatar.file !== null || this.avatar.shouldRemove;
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

		try {
			if (this.password.isChanging && isPasswordInputPresent) {
				await UsersService.changePassword({
					old_password: this.password.current,
					new_password: this.password.new
				});
				updatedFields.push('Password');
				this.password.isChanging = false;
				this.resetPasswordFields();
			}

			if (this.username.isEditing && hasUsernameChange) {
				await UsersService.updateMe({ username: this.username.temp });
				user.username = this.username.temp;
				updatedFields.push('Username');
				this.username.isEditing = false;
			}
			
			// Avatar update via storage service
			if (hasAvatarChange) {
				if (this.avatar.shouldRemove) {
					const updated = await UsersService.updateMe({ avatar_key: null });
					user.avatarUrl = updated.avatar_key ?? null;
				} else if (this.avatar.file) {
					const updated = await StorageService.uploadUserAvatar(this.avatar.file);
					user.avatarUrl = updated.avatar_key ?? null;
				}
				this.avatar.previewUrl = null;
				this.avatar.file = null;
				this.avatar.shouldRemove = false;
				if (this.avatar.fileInput) this.avatar.fileInput.value = '';
				updatedFields.push('Avatar');
			}

			if (updatedFields.length > 0) {
				toasts.show(`${updatedFields.join(', ')} updated successfully!`, 'success');
				// Removing invalid saveToStorage call, as state binds reactively
			}
		} catch (e) {
			toasts.show((e as Error).message || 'Failed to update profile', 'error');
		}
	}

	discardChanges() {
		if (this.avatar.previewUrl?.startsWith('blob:')) {
			URL.revokeObjectURL(this.avatar.previewUrl);
		}
		this.avatar.previewUrl = null;
		this.avatar.file = null;
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
