# Marketplace Technical Documentation

## Backend API Endpoints

### Core Feed & Search
- `GET /api/v1/marketplace`
  - **Query Params:**
    - `page` (int, default=1)
    - `size` (int, default=20)
    - `q` (string, optional) - ILIKE match on title/description
    - `category` (string, optional) - Strict enum match
    - `min_price` (int, optional) - >= filter
    - `max_price` (int, optional) - <= filter
    - `sort` (string, default="newest") - Enum: `newest`, `oldest`, `price_asc`, `price_desc`
  - **Response:** `PaginatedResponse[MarketplaceListingResponse]`
  - **Behavior:** Enforces tenant isolation. Filters by `is_active=True`. Dynamically maps `is_favorited` and `favorite_count` via SQL subquery.

### Listing Management
- `POST /api/v1/marketplace`
  - **Payload:** `MarketplaceListingCreate` `{ title: str, description: str, category: str, price: int, image_key: str | null, is_negotiable: bool }`
  - **Response:** `MarketplaceListingResponse` (201 Created)
- `GET /api/v1/marketplace/{listing_id}`
  - **Path Param:** `listing_id` (UUID)
  - **Response:** `MarketplaceListingResponse`
  - **Behavior:** Returns 404 if listing belongs to foreign tenant.
- `PATCH /api/v1/marketplace/{listing_id}`
  - **Payload:** `MarketplaceListingUpdate` (All fields optional, includes `is_active: bool`)
  - **Behavior:** Returns 403 if `current_user.id != author_id`.
- `DELETE /api/v1/marketplace/{listing_id}`
  - **Behavior:** Returns 204 No Content. Returns 403 if `current_user.id != author_id`.

### Favorites System
- `GET /api/v1/marketplace/favorites`
  - **Query Params:** `page`, `size`
  - **Response:** `PaginatedResponse[MarketplaceListingResponse]`
  - **Behavior:** Returns descending list of user's favorited items.
- `POST /api/v1/marketplace/{listing_id}/favorite`
  - **Behavior:** Inserts composite PK to `marketplace_favorites`. Returns 204. Idempotent.
- `DELETE /api/v1/marketplace/{listing_id}/favorite`
  - **Behavior:** Deletes from `marketplace_favorites`. Returns 204. Idempotent.

### Storage Integration
- `POST /api/v1/storage/presigned-url`
  - **Payload:** `{ "bucket_name": "marketplace-assets" }`
  - **Response:** `{ "url": "https://...", "file_key": "uuid.ext" }`

---

## Frontend Implementation Directives

- **API Service Mapping:** Generate a `MarketplaceService` class mapping exactly to the above endpoints.
- **Query Parameter Handling:** Use `URLSearchParams` to bind the UI search bar, category dropdown, and sort toggle directly to the `GET /api/v1/marketplace` route. Do not perform client-side filtering; rely strictly on the backend query params.
- **State Management (Favorites):**
  - Read `listing.is_favorited` natively from the listing JSON to determine the initial UI state (filled/unfilled heart).
  - Bind the heart `onClick` event to trigger `POST .../favorite` or `DELETE .../favorite` depending on the current state.
  - Optimistically toggle the boolean and increment/decrement `listing.favorite_count` in local state to prevent UI lag.
- **Pagination Hook:** Bind the `PaginatedResponse` metadata (`page`, `total_pages`) to an infinite scroll component or standard page-number footer.
- **Image Upload Pipeline:**
  1. Trigger `POST /api/v1/storage/presigned-url` with `bucket_name: "marketplace-assets"`.
  2. Execute `PUT` request with binary file data against the returned `url`.
  3. Pass the returned `file_key` into the `POST /api/v1/marketplace` payload.
- **Form Validation:** Enforce `price > 0` on the client side. Note that the API expects integers representing cents (or base currency units); ensure the UI masks inputs correctly (e.g., input "15.00" -> submit `1500`).
- **Authorization Context:** The API returns `author_id` in the response. Conditionally render the "Edit" and "Mark Sold" (`PATCH is_active=false`) buttons only if `context.current_user.id === listing.author_id`.
