import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { PostsService } from '$lib/api/services/PostsService';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const post = await PostsService.getPost(params.id);
		return { post };
	} catch (e: any) {
		const msg: string = e?.message || '';
		if (msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('permission')) {
			throw error(403, 'You are not a member of this community.');
		}
		throw error(404, 'Post not found.');
	}
};
