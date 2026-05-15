import type { LibraryFile, LibraryFolder } from '$lib/types/library';
import { toasts } from './toast.svelte';

const FILES_KEY = 'unithread_library_files';
const FOLDERS_KEY = 'unithread_library_folders';

function createLibraryState() {
	let files = $state<LibraryFile[]>([]);
	let folders = $state<LibraryFolder[]>([]);
	let currentFolderId = $state<string | null>(null);
	let loading = $state(false);

	function loadData() {
		if (typeof window === 'undefined') return;
		try {
			const storedFiles = localStorage.getItem(FILES_KEY);
			if (storedFiles) {
				files = JSON.parse(storedFiles);
			}
			const storedFolders = localStorage.getItem(FOLDERS_KEY);
			if (storedFolders) {
				folders = JSON.parse(storedFolders);
			}
		} catch (error) {
			console.error('Failed to load library data', error);
		}
	}

	function saveFiles(updatedFiles: LibraryFile[]) {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(FILES_KEY, JSON.stringify(updatedFiles));
			files = updatedFiles;
		} catch (error) {
			toasts.show('Storage limit exceeded. Could not save file.', 'error');
			throw error;
		}
	}

	function saveFolders(updatedFolders: LibraryFolder[]) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
		folders = updatedFolders;
	}

	function createFolder(name: string) {
		const newFolder: LibraryFolder = {
			id: crypto.randomUUID(),
			name,
			createdAt: new Date().toISOString(),
			parentId: currentFolderId
		};
		saveFolders([...folders, newFolder]);
		toasts.show('Folder created', 'success');
	}

	function enterFolder(id: string | null) {
		currentFolderId = id;
	}

	function goBack() {
		if (!currentFolderId) return;
		const current = folders.find(f => f.id === currentFolderId);
		currentFolderId = current?.parentId ?? null;
	}

	function uploadFile(file: File): Promise<void> {
		return new Promise((resolve, reject) => {
			loading = true;
			const reader = new FileReader();

			reader.onload = (e) => {
				const dataUrl = e.target?.result as string;
				const newFile: LibraryFile = {
					id: crypto.randomUUID(),
					name: file.name,
					type: file.type,
					size: file.size,
					dataUrl,
					createdAt: new Date().toISOString(),
					folderId: currentFolderId
				};

				try {
					saveFiles([newFile, ...files]);
					toasts.show('File saved', 'success');
					resolve();
				} catch (error) {
					reject(error);
				} finally {
					loading = false;
				}
			};

			reader.onerror = () => {
				loading = false;
				toasts.show('Failed to read file', 'error');
				reject(new Error('Failed to read file'));
			};

			reader.readAsDataURL(file);
		});
	}

	function deleteFile(id: string) {
		saveFiles(files.filter(f => f.id !== id));
		toasts.show('File deleted', 'success');
	}

	function deleteFolder(id: string) {
		// Recursive delete
		const folderIdsToDelete = new Set([id]);
		
		// Find all subfolders
		let checkAgain = true;
		while (checkAgain) {
			checkAgain = false;
			folders.forEach(f => {
				if (f.parentId && folderIdsToDelete.has(f.parentId) && !folderIdsToDelete.has(f.id)) {
					folderIdsToDelete.add(f.id);
					checkAgain = true;
				}
			});
		}

		// Update folders and files
		saveFolders(folders.filter(f => !folderIdsToDelete.has(f.id)));
		saveFiles(files.filter(f => !f.folderId || !folderIdsToDelete.has(f.folderId)));
		
		if (currentFolderId === id) {
			goBack();
		}
		
		toasts.show('Folder and its contents deleted', 'success');
	}

	return {
		get files() { return files.filter(f => f.folderId === currentFolderId); },
		get folders() { return folders.filter(f => f.parentId === currentFolderId); },
		get currentPath() {
			const path = [];
			let curr = currentFolderId;
			while (curr) {
				const f = folders.find(folder => folder.id === curr);
				if (f) {
					path.unshift(f);
					curr = f.parentId;
				} else {
					curr = null;
				}
			}
			return path;
		},
		get loading() { return loading; },
		get currentFolderId() { return currentFolderId; },
		loadFiles: loadData,
		uploadFile,
		deleteFile,
		createFolder,
		deleteFolder,
		enterFolder,
		goBack
	};
}

export const libraryState = createLibraryState();
