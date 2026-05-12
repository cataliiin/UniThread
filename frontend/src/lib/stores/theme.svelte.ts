import { browser } from '$app/environment';

export type Theme = 'dark' | 'light' | 'midnight' | 'wasteland' | 'amethyst' | 'cyberpunk' | 'nordic' | 'coffee' | 'cyberpop' | 'sakura';

class ThemeState {
	current = $state<Theme>('dark');

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('theme') as Theme;
			if (saved) {
				this.current = saved;
			}
		}
	}

	setTheme(theme: Theme) {
		this.current = theme;
		if (browser) {
			localStorage.setItem('theme', theme);
			this.applyTheme();
		}
	}

	applyTheme() {
		if (!browser) return;
		const root = document.documentElement;
		root.classList.remove('light', 'midnight', 'wasteland', 'amethyst', 'cyberpunk', 'nordic', 'coffee', 'cyberpop', 'sakura');
		if (this.current !== 'dark') {
			root.classList.add(this.current);
		}
	}
}

export const themeState = new ThemeState();
