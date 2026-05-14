# Direct Messaging & Relationships Technical Documentation

## Backend API Endpoints

### Relationships (Muting & Blocking)
- `POST /api/v1/relationships/{target_id}/block`
  - **Behavior:** Upserts a `UserRelationship` record setting `is_blocked=True`. Returns 204 No Content.
- `DELETE /api/v1/relationships/{target_id}/block`
  - **Behavior:** Updates a `UserRelationship` record setting `is_blocked=False`. Returns 204 No Content.
- `POST /api/v1/relationships/{target_id}/mute`
  - **Behavior:** Upserts a `UserRelationship` record setting `is_muted=True`. Returns 204 No Content.
- `DELETE /api/v1/relationships/{target_id}/mute`
  - **Behavior:** Updates a `UserRelationship` record setting `is_muted=False`. Returns 204 No Content.
- `GET /api/v1/relationships/blocked`
  - **Response:** `PaginatedResponse[BlockedUserResponse]`
  - **Behavior:** Returns a list of users the current user has blocked, ordered by `created_at` descending.

### Direct Messaging
- `POST /api/v1/messages/{recipient_id}`
  - **Payload:** `MessageCreate` `{ content: str }`
  - **Response:** `MessageResponse` (201 Created)
  - **Behavior:** 
    - Verifies the recipient belongs to `current_user.university_id` (404 Not Found if false).
    - Checks `UserRelationship` table. If either user has blocked the other, throws 403 Forbidden.
- `GET /api/v1/messages`
  - **Response:** `list[MessageResponse]`
  - **Behavior:** Returns the user's Inbox. Fetches the latest message for every distinct conversation the user is part of, sorted by `created_at` descending.
- `GET /api/v1/messages/{other_user_id}`
  - **Query Params:** `page`, `size`
  - **Response:** `PaginatedResponse[MessageResponse]`
  - **Behavior:** Returns the chat history between `current_user` and `other_user_id`. Automatically flips `is_read = True` for any fetched unread messages where the current user is the recipient.

---

## Frontend Implementation Directives

- **API Service Mapping:** Generate a `MessagingService` class to map the above endpoints.
- **Tenant Isolation Check:** The UI should only expose the "Message" or "Block" buttons on profiles that belong to the user's university. The backend natively enforces this.
- **Inbox Feed (`/messages`):**
  - Use `GET /api/v1/messages` to build the main inbox UI. The response gives you the latest message preview for each conversation.
  - Check the `is_read` flag. If `is_read === false` and `message.recipient_id === context.current_user.id`, render the preview with an "Unread" indicator (bold text/blue dot).
- **Chat Window (`/messages/{id}`):**
  - Use `GET /api/v1/messages/{other_user_id}` to load the chat history. Note that hitting this endpoint automatically triggers read receipts on the backend.
  - Provide an optimistic UI when sending messages. Append the outgoing message text block to the local feed immediately while `POST /api/v1/messages/{other_user_id}` processes in the background.
- **Block Handling:**
  - Wrap message sending in a try/catch. If the API returns a 403 Forbidden, display an error toast: "You cannot message this user." Do NOT try to differentiate if they blocked you or you blocked them to prevent enumeration probing.
  - Implement a "Blocked Users" settings page using `GET /api/v1/relationships/blocked`. Allow the user to unblock from this list by calling `DELETE /api/v1/relationships/{target_id}/block`.
- **Muting Integration:**
  - If you implement push notifications or local ringing sounds, you must check if the incoming sender is muted. The backend stores this state, but your notification service must query it before pushing alerts.
