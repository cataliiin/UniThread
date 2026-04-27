export interface ToastMessage {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}

class ToastState {
	messages = $state<ToastMessage[]>([]);
	private nextId = 0;

	show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
		const id = this.nextId++;
		this.messages.push({ id, message, type });

		setTimeout(() => {
			this.remove(id);
		}, duration);
	}

	remove(id: number) {
		this.messages = this.messages.filter(m => m.id !== id);
	}
}

export const toasts = new ToastState();
