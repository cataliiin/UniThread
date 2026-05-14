export function formatFullName(firstName?: string | null, lastName?: string | null): string | null {
	const parts = [firstName, lastName].filter(Boolean);
	return parts.length > 0 ? parts.join(' ') : null;
}

export function getAuthorDisplayName(author: { first_name?: string | null, last_name?: string | null, username: string } | null | undefined): string {
	if (!author) return 'Anonymous';
	const fullName = formatFullName(author.first_name, author.last_name);
	return fullName || author.username;
}
