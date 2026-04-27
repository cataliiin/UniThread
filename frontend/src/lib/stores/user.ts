import { writable } from 'svelte/store';

export const user = writable({
	name: 'George-Sebastian Somu',
	username: 'sebig',
	email: 'george.somu@student.unitbv.ro',
	university: 'Transilvania University of Brașov',
	memberSince: 'April 2026',
	avatarInitials: 'GS'
});
