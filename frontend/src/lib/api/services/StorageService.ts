import { api } from '$lib/api/client';
import type { components } from '$lib/api/openapi-generated-schema';
import { requireData } from '$lib/api/services/helpers';

type PresignedUrlRequest = components['schemas']['PresignedUrlRequest'];
type PresignedUrlResponse = components['schemas']['PresignedUrlResponse'];
type BucketName = components['schemas']['BucketName'];

export const StorageService = {
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
};