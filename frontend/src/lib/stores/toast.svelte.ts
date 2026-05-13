export interface ToastMessage {
	id: number;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

function createToastState() {
	let messages = $state<ToastMessage[]>([]);
	let nextId = 0;

	function show(
		message: string,
		type: ToastMessage['type'] = 'success',
		duration = 4000,
		action?: ToastMessage['action']
	) {
		const id = nextId++;
		messages.push({ id, message, type, duration, action });

		setTimeout(() => {
			remove(id);
		}, duration);

		return id;
	}

	function remove(id: number) {
		messages = messages.filter((m) => m.id !== id);
	}

	function success(message: string, duration = 4000, action?: ToastMessage['action']) {
		return show(message, 'success', duration, action);
	}

	function error(message: string, duration = 4000, action?: ToastMessage['action']) {
		return show(message, 'error', duration, action);
	}

	function warning(message: string, duration = 4000, action?: ToastMessage['action']) {
		return show(message, 'warning', duration, action);
	}

	function info(message: string, duration = 4000, action?: ToastMessage['action']) {
		return show(message, 'info', duration, action);
	}

	return {
		get messages() {
			return messages;
		},
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
	success: (message: string, duration = 4000, action?: ToastMessage['action']) =>
		toasts.success(message, duration, action),
	error: (message: string, duration = 4000, action?: ToastMessage['action']) =>
		toasts.error(message, duration, action),
	warning: (message: string, duration = 4000, action?: ToastMessage['action']) =>
		toasts.warning(message, duration, action),
	info: (message: string, duration = 4000, action?: ToastMessage['action']) =>
		toasts.info(message, duration, action)
};
