export interface LibraryFile {
	id: string;
	name: string;
	type: string;
	size: number;
	dataUrl: string;
	createdAt: string;
	folderId: string | null;
}

export interface LibraryFolder {
	id: string;
	name: string;
	createdAt: string;
	parentId: string | null;
}
