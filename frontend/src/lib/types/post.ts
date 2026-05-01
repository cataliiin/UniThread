export interface Post {
	id: number;
	authorId: number;
	authorName: string;
	authorUsername: string;
	authorAvatar?: string;
	content: string;
	createdAt: string;
	likes: number;
	comments: number;
	liked: boolean;
	university: string;
}

export type SortOption = 'new' | 'top';

export interface PostsState {
	posts: Post[];
	sort: SortOption;
	page: number;
	hasMore: boolean;
	loading: boolean;
}

// Mock data generator
function generateMockPosts(university: string, count: number, startId: number): Post[] {
	const names = ['Alex Popescu', 'Maria Ionescu', 'John Smith', 'Emma Wilson', 'Carlos Garcia', 'Yuki Tanaka', 'Anna Mueller', 'Lucas Dubois'];
	const usernames = ['alexp', 'maria_ionescu', 'johnsmith', 'emma_w', 'carlosg', 'yuki_t', 'annam', 'lucad'];
	const contents = [
		'Just finished my finals! 🎉 Ready for summer break!',
		'Anyone else struggling with the new campus WiFi? It\'s been really slow lately.',
		'Found an amazing study spot in the library. Quiet and great lighting!',
		'Reminder: Campus career fair is next week! Don\'t forget to update your resumes.',
		'Beautiful day on campus! ☀️ Love seeing everyone enjoying the weather.',
		'Pro tip: The coffee at the new cafe near the science building is amazing!',
		'Group project tips: Start early, communicate often, and don\'t procrastinate!',
		'Excited to announce I got an internship at my dream company!',
		'Study group for Algorithms tomorrow at 3pm in Room 204. All welcome!',
		'The sunset from the rooftop is absolutely stunning tonight 🌅'
	];

	return Array.from({ length: count }, (_, i) => {
		const authorIndex = (startId + i) % names.length;
		const contentIndex = (startId + i) % contents.length;
		const daysAgo = Math.floor(Math.random() * 7);
		const hoursAgo = Math.floor(Math.random() * 24);
		
		return {
			id: startId + i,
			authorId: authorIndex + 1,
			authorName: names[authorIndex],
			authorUsername: usernames[authorIndex],
			content: contents[contentIndex],
			createdAt: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString(),
			likes: Math.floor(Math.random() * 50),
			comments: Math.floor(Math.random() * 15),
			liked: Math.random() > 0.7,
			university
		};
	});
}

export const mockPosts = {
	generate: generateMockPosts
};