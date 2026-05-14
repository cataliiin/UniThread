import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';
import { CommunitiesService } from '$lib/api/services/CommunitiesService';
import { PostsService } from '$lib/api/services/PostsService';
import { UsersService } from '$lib/api/services/UsersService';

type PresignedUrlRequest = components['schemas']['PresignedUrlRequest'];
type PresignedUrlResponse = components['schemas']['PresignedUrlResponse'];
type BucketName = components['schemas']['BucketName'];
type CommunityResponse = components['schemas']['CommunityResponse'];
type PostResponse = components['schemas']['PostResponse'];
type UserResponse = components['schemas']['UserResponse'];

const storageBaseUrl = (import.meta.env.VITE_STORAGE_URL || 'http://localhost:9000').replace(
    /\/+$/,
    ''
);

export const StorageService = {
    getPublicUrl(bucketName: BucketName, fileKey: string | null): string | null {
        if (!fileKey) return null;
        return `${storageBaseUrl}/${bucketName}/${fileKey}`;
    },
    async getPresignedUrl(
        bucketNameOrParams: BucketName | { bucketName: BucketName }
    ): Promise<PresignedUrlResponse> {
        const bucketName =
            typeof bucketNameOrParams === 'string'
                ? bucketNameOrParams
                : bucketNameOrParams.bucketName;
        const payload: PresignedUrlRequest = { bucket_name: bucketName };
        const { data } = await api.POST('/api/v1/storage/presigned-url', { body: payload });
        return requireData(data);
    },

    async uploadToPresignedUrl(
        url: string,
        file: Blob,
        contentType?: string
    ): Promise<void> {
        const resolvedType = contentType ?? (file.type || 'application/octet-stream');
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': resolvedType,
            },
            body: file,
        });

        if (!response.ok) {
            throw new Error(`Upload failed (${response.status} ${response.statusText})`);
        }
    },

    async uploadAsset(
        bucketName: BucketName,
        file: Blob,
        contentType?: string
    ): Promise<PresignedUrlResponse> {
        const presigned = await StorageService.getPresignedUrl(bucketName);
        await StorageService.uploadToPresignedUrl(presigned.url, file, contentType);
        return presigned;
    },

    async uploadUserAvatar(
        file: Blob,
        contentType?: string
    ): Promise<UserResponse> {
        const { file_key } = await StorageService.uploadAsset(
            'user-assets',
            file,
            contentType
        );
        return UsersService.updateMe({ avatar_key: file_key });
    },

    async uploadPostImage(
        postId: string,
        file: Blob,
        contentType?: string
    ): Promise<PostResponse> {
        const { file_key } = await StorageService.uploadAsset(
            'post-assets',
            file,
            contentType
        );
        return PostsService.updatePost(postId, { image_key: file_key });
    },

    async uploadCommunityIcon(
        communityId: string,
        file: Blob,
        contentType?: string
    ): Promise<CommunityResponse> {
        const { file_key } = await StorageService.uploadAsset(
            'community-assets',
            file,
            contentType
        );
        return CommunitiesService.update(communityId, { icon_key: file_key });
    },

    async uploadCommunityBanner(
        communityId: string,
        file: Blob,
        contentType?: string
    ): Promise<CommunityResponse> {
        const { file_key } = await StorageService.uploadAsset(
            'community-assets',
            file,
            contentType
        );
        return CommunitiesService.update(communityId, { banner_key: file_key });
    },
};