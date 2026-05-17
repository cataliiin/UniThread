import type { Notification } from "$lib/types/notification";
import type { NotificationType } from "$lib/types/notification";
import { NotificationsService } from "$lib/api/services/NotificationsService";

class NotificationStore {
    notifications = $state<Notification[]>([]);

    unreadCount = $derived.by(() => this.notifications.filter(n => !n.read).length);

    async fetchNotifications() {
        try {
            const data = await NotificationsService.listNotifications();
            this.notifications = data.map((n: any) => ({
                id: n.id,
                sender_id: n.sender_id || '',
                receiver_id: n.receiver_id,
                sender_name: n.sender_name || 'Anonymous',
                sender_avatar: n.sender_avatar,
                type: n.type as NotificationType,
                read: n.read,
                created_at: new Date(n.created_at),
                action_url: n.action_url || '',
                post_id: n.post_id || undefined,
                post_content: n.post_content || undefined,
                community_id: n.community_id || undefined,
                community_name: n.community_name || undefined,
                community_icon: n.community_icon || undefined,
                message: n.message || '',
            } as unknown as Notification));
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    }

    add(notification: Notification) {
        this.notifications.unshift(notification);
    }

    remove(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id)
    }

    async markAsRead(id: string) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            try {
                await NotificationsService.markAsRead(id);
            } catch (err) {
                console.warn("Failed to mark notification as read (might be transient):", err);
            }
        }
    }

    async markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        try {
            await NotificationsService.markAllAsRead();
        } catch (err) {
            console.error("Failed to mark all notifications as read:", err);
        }
    }

    getByType(type: NotificationType) {
        return this.notifications.filter(n => n.type === type)
    }
}

export const notifications = new NotificationStore();
