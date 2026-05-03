import type { Notification } from "$lib/types/notification";
import type { NotificationType } from "$lib/types/notification";
class NotificationStore {
    notifications = $state<Notification[]>([]);

    unreadCount = $derived.by(() => this.notifications.filter(n => !n.read).length);

    add(notification: Notification) {
        this.notifications.unshift(notification);
    }
    remove(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id)
    }

    markAsRead(id: string) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
    }

    getByType(type: NotificationType) {
        return this.notifications.filter(n => n.type === type)
    }
}

export const notifications = new NotificationStore();
