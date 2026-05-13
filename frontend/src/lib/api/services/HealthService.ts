import { api } from '$lib/api/client';
import { requireData } from '$lib/api/services/helpers';

type HealthResponse = {
    status: string;
    project: string;
    services: {
        database: string;
        minio: string;
    };
    last_checked: string | null;
};

export const HealthService = {
    async getHealth(): Promise<HealthResponse> {
        const { data } = await api.GET('/health');
        return requireData(data as HealthResponse | undefined);
    },
};