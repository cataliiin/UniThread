export interface PhotoViewerState {
	isOpen: boolean;
	src: string | null;
	alt: string;
}

class PhotoViewerStore {
	#state = $state<PhotoViewerState>({
		isOpen: false,
		src: null,
		alt: ''
	});

	get isOpen() {
		return this.#state.isOpen;
	}

	get src() {
		return this.#state.src;
	}

	get alt() {
		return this.#state.alt;
	}

	open(src: string, alt: string = '') {
		this.#state.src = src;
		this.#state.alt = alt;
		this.#state.isOpen = true;
	}

	close() {
		this.#state.isOpen = false;
		// Don't clear src immediately to allow for closing animations
		setTimeout(() => {
			if (!this.#state.isOpen) {
				this.#state.src = null;
			}
		}, 300);
	}
}

export const photoViewer = new PhotoViewerStore();
