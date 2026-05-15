<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user.svelte';
	import { libraryState } from '$lib/stores/library.svelte';
	import {
		UploadCloud,
		File,
		FileText,
		Image as ImageIcon,
		Trash2,
		Download,
		Folder,
		ChevronRight,
		FolderPlus,
		ArrowLeft
	} from 'lucide-svelte';

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);
	let showFolderModal = $state(false);
	let newFolderName = $state('');

	onMount(() => {
		libraryState.loadFiles();
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) {
			for (const file of Array.from(e.dataTransfer.files)) {
				await libraryState.uploadFile(file);
			}
		}
	}

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			for (const file of Array.from(target.files)) {
				await libraryState.uploadFile(file);
			}
			target.value = ''; // Reset input
		}
	}

	function triggerFileInput() {
		fileInput.click();
	}

	function handleCreateFolder() {
		newFolderName = '';
		showFolderModal = true;
	}

	function confirmFolderCreate() {
		if (newFolderName && newFolderName.trim()) {
			libraryState.createFolder(newFolderName.trim());
			showFolderModal = false;
			newFolderName = '';
		}
	}

	function cancelFolderCreate() {
		showFolderModal = false;
		newFolderName = '';
	}

	function formatBytes(bytes: number, decimals = 2) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}

	function getFileIcon(type: string) {
		if (type.startsWith('image/')) return ImageIcon;
		if (type === 'application/pdf') return FileText;
		return File;
	}

	function downloadFile(dataUrl: string, name: string) {
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

<div class="library-container">
	<header class="library-header">
		<div class="header-content">
			<div>
				<h1>My Library</h1>
				<p>Store and manage your personal files locally</p>
			</div>
			<div class="header-actions">
				<button class="header-btn" onclick={handleCreateFolder} title="New Folder">
					<FolderPlus size={20} />
					<span>New Folder</span>
				</button>
			</div>
		</div>
	</header>

	<div class="navigation-bar">
		<button
			class="back-btn"
			onclick={() => libraryState.goBack()}
			disabled={!libraryState.currentFolderId}
		>
			<ArrowLeft size={18} />
		</button>

		<div class="breadcrumbs">
			<button class="breadcrumb-item" onclick={() => libraryState.enterFolder(null as any)}>
				Library
			</button>
			{#each libraryState.currentPath as folder}
				<ChevronRight size={14} class="breadcrumb-sep" />
				<button class="breadcrumb-item" onclick={() => libraryState.enterFolder(folder.id)}>
					{folder.name}
				</button>
			{/each}
		</div>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="upload-zone {isDragging ? 'dragging' : ''} {libraryState.loading ? 'loading' : ''}"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		onclick={triggerFileInput}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerFileInput()}
		role="button"
		tabindex="0"
	>
		<input
			type="file"
			bind:this={fileInput}
			onchange={handleFileSelect}
			multiple
			class="hidden-input"
		/>

		<div class="upload-content">
			<UploadCloud size={32} class="upload-icon" />
			<h3>{libraryState.loading ? 'Uploading...' : 'Drag & Drop Files Here'}</h3>
			<p>or click to browse files</p>
		</div>
	</div>

	<div class="files-grid">
		{#each libraryState.folders as folder (folder.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="file-card folder-card"
				onclick={() => libraryState.enterFolder(folder.id)}
				onkeydown={(e) =>
					(e.key === 'Enter' || e.key === ' ') && libraryState.enterFolder(folder.id)}
				role="button"
				tabindex="0"
			>
				<div class="file-preview">
					<div class="generic-preview">
						<Folder size={64} class="folder-icon" />
					</div>

					<div class="file-actions">
						<button
							class="action-btn delete-btn"
							onclick={(e) => {
								e.stopPropagation();
								libraryState.deleteFolder(folder.id);
							}}
							title="Delete Folder"
						>
							<Trash2 size={18} />
						</button>
					</div>
				</div>
				<div class="file-info">
					<h4 class="file-name" title={folder.name}>{folder.name}</h4>
					<p class="file-meta">
						Folder • {new Date(folder.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>
		{/each}

		{#each libraryState.files as file (file.id)}
			<div class="file-card">
				<div class="file-preview">
					{#if file.type.startsWith('image/')}
						<img src={file.dataUrl} alt={file.name} class="image-preview" />
					{:else}
						{@const Icon = getFileIcon(file.type)}
						<div class="generic-preview">
							<Icon size={64} class="file-type-icon" />
						</div>
					{/if}

					<div class="file-actions">
						<button
							class="action-btn download-btn"
							onclick={(e) => {
								e.stopPropagation();
								downloadFile(file.dataUrl, file.name);
							}}
							title="Download"
						>
							<Download size={18} />
						</button>
						<button
							class="action-btn delete-btn"
							onclick={(e) => {
								e.stopPropagation();
								libraryState.deleteFile(file.id);
							}}
							title="Delete"
						>
							<Trash2 size={18} />
						</button>
					</div>
				</div>
				<div class="file-info">
					<h4 class="file-name" title={file.name}>{file.name}</h4>
					<p class="file-meta">
						{formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>
		{:else}
			{#if libraryState.folders.length === 0}
				<div class="empty-state">
					<File size={48} class="empty-icon" />
					<p>This folder is empty. Upload some files to get started.</p>
				</div>
			{/if}
		{/each}
	</div>
</div>

{#if showFolderModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={cancelFolderCreate}>
		<div class="modal-card" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Create New Folder</h3>
			</div>
			<div class="modal-body">
				<input
					type="text"
					bind:value={newFolderName}
					placeholder="Folder name"
					class="modal-input"
					onkeydown={(e) => e.key === 'Enter' && confirmFolderCreate()}
					autofocus
				/>
			</div>
			<div class="modal-footer">
				<button class="modal-btn cancel-btn" onclick={cancelFolderCreate}>Cancel</button>
				<button class="modal-btn confirm-btn" onclick={confirmFolderCreate}>Create Folder</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}

	.library-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}

	.library-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.header-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.2rem;
		background-color: var(--primary);
		color: var(--primary-foreground);
		border: none;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.header-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.navigation-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		background: var(--muted);
		padding: 0.5rem 1rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid var(--border);
		background: var(--card);
		color: var(--foreground);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:hover:not(:disabled) {
		background: var(--accent);
		color: var(--primary);
	}

	.back-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--muted-foreground);
		overflow-x: auto;
		white-space: nowrap;
	}

	.breadcrumb-item {
		border: none;
		background: none;
		padding: 0.2rem 0.4rem;
		color: var(--muted-foreground);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.breadcrumb-item:hover {
		color: var(--primary);
		background: var(--accent);
	}

	.breadcrumb-sep {
		opacity: 0.5;
	}

	.library-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--foreground);
		margin: 0 0 0.25rem 0;
		letter-spacing: -0.025em;
	}

	.library-header p {
		color: var(--muted-foreground);
		margin: 0;
		font-size: 1rem;
	}

	.upload-zone {
		border: 2px dashed var(--border);
		border-radius: var(--radius);
		padding: 1.5rem 1rem;
		text-align: center;
		background-color: var(--card);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		margin-bottom: 2rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	/* ... existing styles ... */
	.folder-card {
		cursor: pointer;
	}

	.folder-icon {
		color: var(--primary);
		opacity: 0.8;
	}

	.folder-card:hover .folder-icon {
		transform: scale(1.1);
		transition: transform 0.3s ease;
	}

	.upload-zone:hover,
	.upload-zone.dragging {
		border-color: var(--primary);
		background-color: var(--accent);
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
	}

	.upload-zone.loading {
		opacity: 0.7;
		pointer-events: none;
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.hidden-input {
		display: none;
	}

	.upload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.upload-icon {
		color: var(--primary);
		transition: transform 0.3s ease;
	}

	.upload-zone:hover .upload-icon {
		transform: scale(1.1) translateY(-3px);
	}

	.upload-content h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--foreground);
	}

	.upload-content p {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.9rem;
	}

	.files-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.file-card {
		background: var(--card);
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		border: 1px solid var(--border);
	}

	.file-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
	}

	.file-preview {
		height: 160px;
		position: relative;
		background: var(--muted);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-bottom: 1px solid var(--border);
	}

	.image-preview {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.file-card:hover .image-preview {
		transform: scale(1.05);
	}

	.generic-preview {
		color: var(--muted-foreground);
	}

	.file-actions {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		opacity: 0;
		transition: opacity 0.2s ease;
		backdrop-filter: blur(2px);
	}

	.file-card:hover .file-actions {
		opacity: 1;
	}

	.action-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: white;
		transition: all 0.2s ease;
	}

	.download-btn {
		background-color: var(--primary);
		color: var(--primary-foreground);
	}

	.download-btn:hover {
		filter: brightness(1.1);
		transform: scale(1.1);
	}

	.delete-btn {
		background-color: var(--destructive);
		color: var(--destructive-foreground);
	}

	.delete-btn:hover {
		filter: brightness(1.1);
		transform: scale(1.1);
	}

	.file-info {
		padding: 1rem;
	}

	.file-name {
		margin: 0 0 0.5rem 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--foreground);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-meta {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted-foreground);
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		background: var(--card);
		border-radius: var(--radius);
		border: 1px dashed var(--border);
		color: var(--muted-foreground);
	}

	.empty-icon {
		color: var(--muted-foreground);
		margin-bottom: 1rem;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		width: 100%;
		max-width: 400px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
		animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes modal-pop {
		0% {
			transform: scale(0.9);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--foreground);
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--foreground);
		font-size: 1rem;
		transition: border-color 0.2s ease;
	}

	.modal-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 2px var(--accent);
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.modal-btn {
		padding: 0.6rem 1.2rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted-foreground);
	}

	.cancel-btn:hover {
		background: var(--accent);
		color: var(--foreground);
	}

	.confirm-btn {
		background: var(--primary);
		color: var(--primary-foreground);
		border: none;
	}

	.confirm-btn:hover {
		filter: brightness(1.1);
	}
</style>
