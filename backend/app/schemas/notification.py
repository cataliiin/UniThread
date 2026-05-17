from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.database.models.enums import NotificationType

class NotificationResponse(BaseModel):
    id: UUID
    sender_id: UUID | None = None
    receiver_id: UUID
    type: NotificationType
    read: bool
    created_at: datetime
    action_url: str | None = None
    
    sender_name: str | None = None
    sender_avatar: str | None = None
    
    post_id: str | None = None
    post_content: str | None = None
    community_id: str | None = None
    community_name: str | None = None
    community_icon: str | None = None
    message: str | None = None

    model_config = ConfigDict(from_attributes=True)
