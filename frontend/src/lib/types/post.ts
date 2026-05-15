import type { components } from '$lib/api/openapi-generated-schema';

export type ApiPost = components['schemas']['PostFeedResponse'];

export type Post = ApiPost & {
	// UI-specific derived fields
	liked: boolean;
	university: string;
	// Any other UI-specific flags
	is_loading?: boolean;
};

export type SortOption = 'new' | 'top';

export type FeedType = 'global' | 'personalized';

export interface PostsState {
	posts: Post[];
	sort: SortOption;
	page: number;
	hasMore: boolean;
	loading: boolean;
}

// Mock data generator
function generateMockPosts(university: string, count: number, startId: number): Post[] {
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

	return Array.from({ length: count }, (_, i) => {
		const authorIndex = (startId + i) % names.length;
		const contentIndex = (startId + i) % contents.length;
		const daysAgo = Math.floor(Math.random() * 7);
		const hoursAgo = Math.floor(Math.random() * 24);

		return {
			id: (startId + i).toString(),
			title: 'Mock Post Title',
			community_id: 'mock_community_id',
			author_id: (authorIndex + 1).toString(),
			created_at: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString(),
			updated_at: null,
			is_anonymous: false,
			score: Math.floor(Math.random() * 50),
			comment_count: Math.floor(Math.random() * 15),
			community: {
				id: 'mock_community_id',
				name: university,
				type: 'public',
				allow_anonymous: false,
				owner_id: 'mock_owner_id',
				university_id: 'mock_university_id',
				created_at: new Date().toISOString(),
				member_count: 100,
				icon_key: null
			},
			authorId: authorIndex + 1,
			authorName: names[authorIndex],
			authorUsername: usernames[authorIndex],
			content: contents[contentIndex],
			createdAt: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString(),
			likes: Math.floor(Math.random() * 50),
			comments: Math.floor(Math.random() * 15),
			liked: Math.random() > 0.7,
			university
		} as Post;
	});
}

export const mockPosts = {
	generate: generateMockPosts
};
