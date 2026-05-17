export enum NotificationType {
    Invitation = "invitation",
    Message = "message",
    Post = "post",
    Like = "like",
    Comment = "comment",
    AcceptInvitation = "accept_invitation",
    DeclineInvitation = "decline_invitation",
    JoinRequest = "join_request",
    AcceptJoinRequest = "accept_join_request",
    DeclineJoinRequest = "decline_join_request"
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

export interface JoinRequestNotification extends BaseNotification {
    type: NotificationType.JoinRequest;
    community_id: string;
    community_name: string;
    community_icon: string | null;
    message: string;
}

export interface AcceptJoinRequestNotification extends BaseNotification {
    type: NotificationType.AcceptJoinRequest;
    community_id: string;
    community_name: string;
    community_icon: string | null;
    message: string;
}

export interface DeclineJoinRequestNotification extends BaseNotification {
    type: NotificationType.DeclineJoinRequest;
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
    JoinRequestNotification |
    AcceptJoinRequestNotification |
    DeclineJoinRequestNotification |
    MessageNotification |
    PostNotification |
    LikeNotification |
    CommentNotification;
