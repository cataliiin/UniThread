export interface ToastMessage {
	id: number;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration: number;
}

function createToastState() {
	let messages = $state<ToastMessage[]>([]);
	let nextId = 0;

	function show(message: string, type: ToastMessage['type'] = 'success', duration = 4000) {
		const id = nextId++;
		messages.push({ id, message, type, duration });

		setTimeout(() => {
			remove(id);
		}, duration);

		return id;
	}

	function remove(id: number) {
		messages = messages.filter((m) => m.id !== id);
	}

	function success(message: string, duration = 4000) {
		return show(message, 'success', duration);
	}

	function error(message: string, duration = 4000) {
		return show(message, 'error', duration);
	}

	function warning(message: string, duration = 4000) {
		return show(message, 'warning', duration);
	}

	function info(message: string, duration = 4000) {
		return show(message, 'info', duration);
	}

	return {
		get messages() { return messages; },
		show,
		remove,
		success,
		error,
		warning,
		info
	};
}

export const toasts = createToastState();

// Export helper functions for convenience
export const toast = {
	success: (message: string, duration = 4000) => toasts.success(message, duration),
	error: (message: string, duration = 4000) => toasts.error(message, duration),
	warning: (message: string, duration = 4000) => toasts.warning(message, duration),
	info: (message: string, duration = 4000) => toasts.info(message, duration)
};
