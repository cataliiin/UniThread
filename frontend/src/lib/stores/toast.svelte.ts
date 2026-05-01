export interface ToastMessage {
	id: number;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration: number;
}

class ToastState {
	messages = $state<ToastMessage[]>([]);
	private nextId = 0;

	show(message: string, type: ToastMessage['type'] = 'success', duration = 4000) {
		const id = this.nextId++;
		this.messages.push({ id, message, type, duration });

		setTimeout(() => {
			this.remove(id);
		}, duration);

		return id;
	}

	remove(id: number) {
		this.messages = this.messages.filter((m) => m.id !== id);
	}

	// Helper functions
	success(message: string, duration = 4000) {
		return this.show(message, 'success', duration);
	}

	error(message: string, duration = 4000) {
		return this.show(message, 'error', duration);
	}

	warning(message: string, duration = 4000) {
		return this.show(message, 'warning', duration);
	}

	info(message: string, duration = 4000) {
		return this.show(message, 'info', duration);
	}
}

export const toasts = new ToastState();

// Export helper functions for convenience
export const toast = {
	success: (message: string, duration = 4000) => toasts.success(message, duration),
	error: (message: string, duration = 4000) => toasts.error(message, duration),
	warning: (message: string, duration = 4000) => toasts.warning(message, duration),
	info: (message: string, duration = 4000) => toasts.info(message, duration)
};
