export type SearchFilter = 'all' | 'users' | 'communities' | 'posts';

export interface SearchResult {
	id: number;
	type: 'user' | 'community' | 'post';
}

export interface UserResult {
	id: number;
	name: string;
	username: string;
	avatarInitials: string;
	avatarUrl?: string;
	memberSince: string;
	followers: number;
}

export interface CommunityResult {
	id: number;
	name: string;
	description: string;
	members: number;
	posts: number;
	isJoined: boolean;
	university: string;
}

export interface PostResult {
	id: number;
	authorId: number;
	authorName: string;
	authorUsername: string;
	content: string;
	createdAt: string;
	likes: number;
	comments: number;
	university: string;
}

// Mock data generators
function generateMockUsers(query: string, university: string, count: number): UserResult[] {
	const names = [
		'Alex Popescu',
		'Maria Ionescu',
		'John Smith',
		'Emma Wilson',
		'Carlos Garcia',
		'Yuki Tanaka',
		'Anna Mueller',
		'Lucas Dubois'
	];
	const usernames = [
		'alexp',
		'maria_ionescu',
		'johnsmith',
		'emma_w',
		'carlosg',
		'yuki_t',
		'annam',
		'lucad'
	];

	const filtered = names.filter(
		(name) =>
			query === '' ||
			name.toLowerCase().includes(query.toLowerCase()) ||
			usernames[names.indexOf(name)].toLowerCase().includes(query.toLowerCase())
	);

	return filtered.slice(0, count).map((name, i) => ({
		id: i + 1,
		name,
		username: usernames[names.indexOf(name)],
		avatarInitials: name
			.split(' ')
			.map((n) => n[0])
			.join(''),
		memberSince: 'Jan 2024',
		followers: Math.floor(Math.random() * 500) + 50
	}));
}

function generateMockCommunities(
	query: string,
	university: string,
	count: number
): CommunityResult[] {
	const communities = [
		{ name: 'Computer Science', description: 'For CS students and enthusiasts' },
		{ name: 'Mathematics Club', description: 'Math problems, puzzles, and discussions' },
		{ name: 'Photography Society', description: 'Share your photos and learn techniques' },
		{ name: 'Sports Fan Club', description: 'All things sports - games, teams, events' },
		{ name: 'Music Lovers', description: 'Concerts, instruments, and music theory' },
		{ name: 'Book Club', description: 'Monthly book discussions and recommendations' },
		{ name: 'Startup Hub', description: 'Entrepreneurship and innovation' },
		{ name: 'Language Exchange', description: 'Practice foreign languages with peers' }
	];

	const filtered = communities.filter(
		(c) =>
			query === '' ||
			c.name.toLowerCase().includes(query.toLowerCase()) ||
			c.description.toLowerCase().includes(query.toLowerCase())
	);

	const results = filtered.slice(0, count).map((c, i) => {
		const members = Math.floor(Math.random() * 500) + 100;
		return {
			id: i + 1,
			name: c.name,
			description: c.description,
			members,
			posts: Math.floor(Math.random() * 50) + 10,
			isJoined: Math.random() > 0.7,
			university
		};
	});

	if (query === '') {
		results.sort((a, b) => b.members - a.members);
	}

	return results;
}

function generateMockPosts(query: string, university: string, count: number): PostResult[] {
	const contents = [
		'Just finished my finals! 🎉 Ready for summer break!',
		"Anyone else struggling with the new campus WiFi? It's been really slow lately.",
		'Found an amazing study spot in the library. Quiet and great lighting!',
		"Reminder: Campus career fair is next week! Don't forget to update your resumes.",
		'Beautiful day on campus! ☀️ Love seeing everyone enjoying the weather.',
		'Pro tip: The coffee at the new cafe near the science building is amazing!',
		"Group project tips: Start early, communicate often, and don't procrastinate!",
		'Excited to announce I got an internship at my dream company!',
		'Study group for Algorithms tomorrow at 3pm in Room 204. All welcome!',
		'The sunset from the rooftop is absolutely stunning tonight 🌅'
	];

	const filtered = contents.filter(
		(c) => query === '' || c.toLowerCase().includes(query.toLowerCase())
	);

	const names = ['Alex Popescu', 'Maria Ionescu', 'John Smith', 'Emma Wilson'];
	const usernames = ['alexp', 'maria_ionescu', 'johnsmith', 'emma_w'];

	return filtered.slice(0, count).map((content, i) => ({
		id: i + 1,
		authorId: (i % names.length) + 1,
		authorName: names[i % names.length],
		authorUsername: usernames[i % usernames.length],
		content,
		createdAt: new Date(Date.now() - i * 3600000).toISOString(),
		likes: Math.floor(Math.random() * 50),
		comments: Math.floor(Math.random() * 15),
		university
	}));
}

export const mockSearch = {
	generateUsers: generateMockUsers,
	generateCommunities: generateMockCommunities,
	generatePosts: generateMockPosts
};
