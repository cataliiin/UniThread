export interface NotificationResponse {
    id: string;
    sender_id: string | null;
    receiver_id: string;
    type: string;
    read: boolean;
    created_at: string;
    action_url: string | null;
    sender_name: string | null;
    sender_avatar: string | null;
    post_id: string | null;
    post_content: string | null;
    community_id: string | null;
    community_name: string | null;
    community_icon: string | null;
    message: string;
}

const BASE_URL = 'http://127.0.0.1:8000';

function getHeaders() {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export const NotificationsService = {
    async listNotifications(): Promise<NotificationResponse[]> {
        try {
            const res = await fetch(`${BASE_URL}/api/v1/notifications`, {
                headers: getHeaders()
            });
            if (!res.ok) return [];
            return await res.json();
        } catch (err) {
            console.error('Failed to list notifications:', err);
            return [];
        }
    },

    async markAsRead(notificationId: string): Promise<NotificationResponse> {
        const res = await fetch(`${BASE_URL}/api/v1/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!res.ok) {
            throw new Error(`Failed to mark notification as read: ${res.statusText}`);
        }
        return await res.json();
    },

    async markAllAsRead(): Promise<void> {
        const res = await fetch(`${BASE_URL}/api/v1/notifications/read-all`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!res.ok) {
            throw new Error(`Failed to mark all notifications as read: ${res.statusText}`);
        }
    },

    async deleteNotification(notificationId: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/api/v1/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
            throw new Error(`Failed to delete notification: ${res.statusText}`);
        }
    }
};
