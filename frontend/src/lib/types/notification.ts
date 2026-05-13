export enum NotificationType {
    Invitation = "invitation",
    Message = "message",
    Post = "post",
    Like = "like",
    Comment = "comment",
    AcceptInvitation = "accept_invitation",
    DeclineInvitation = "decline_invitation"
}

export interface BaseNotification {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    sender_avatar?: string | null;
    type: NotificationType;
    read: boolean;
    created_at: Date;
    action_url?: string;
}
export interface InvitationNotification extends BaseNotification {
    type: NotificationType.Invitation;
    community_id: string;
    community_name: string;
    community_icon: string | null;
    message: string;
}

export interface AcceptInvitationNotification extends BaseNotification {
    type: NotificationType.AcceptInvitation;
    community_id: string;
    community_name: string;
    community_icon: string | null;
    message: string;
}

export interface DeclineInvitationNotification extends BaseNotification {
    type: NotificationType.DeclineInvitation;
    community_id: string;
    community_name: string;
    community_icon: string | null;
    message: string;
}

export interface MessageNotification extends BaseNotification {
    type: NotificationType.Message;
    message: string;
}

export interface PostNotification extends BaseNotification {
    type: NotificationType.Post;
    post_id: string;
    post_content: string;
    message: string;
}

export interface LikeNotification extends BaseNotification {
    type: NotificationType.Like;
    post_id: string;
    post_content: string;
    message: string;
}

export interface CommentNotification extends BaseNotification {
    type: NotificationType.Comment;
    post_id: string;
    post_content: string;
    message: string;
}


export type Notification =
    InvitationNotification |
    AcceptInvitationNotification |
    DeclineInvitationNotification |
    MessageNotification |
    PostNotification |
    LikeNotification |
    CommentNotification;
