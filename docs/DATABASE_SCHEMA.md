# UNITTHREAD — Full Database Schema
> PostgreSQL 15+

---

## Design Principles

- `author_id = NULL` on posts means anonymous post (no redundant boolean column)
- Post score is calculated dynamically from the `votes` table (`SUM`)
- Ban = row deleted from `community_members` (not a separate status)
- `invite_code` does not exist on `communities` — managed in `community_invite_links`
- File columns store only the **MinIO object key** (e.g. `"a1b2c3.webp"`), never the full URL. The URL is assembled at runtime: `{MINIO_PUBLIC_URL}/{bucket}/{key}`. This allows endpoint/CDN changes with zero DB migrations.

---

## Enums

```sql
-- Controls how users can join a community
CREATE TYPE community_type AS ENUM (
    'public',   -- any registered student can join directly
    'request',  -- user submits a join request; admin approves or rejects
    'invite'    -- access only via invite link or a direct nomination from admin
);

-- Membership state within a community
CREATE TYPE member_status AS ENUM (
    'pending',  -- join request submitted, waiting for admin decision (type='request' only)
    'approved'  -- active member with full access
    -- Ban is not a status — a banned user is simply deleted from this table.
    -- If you need a ban audit trail, add a community_bans table post-MVP.
);

-- State of a direct (nominal) invitation sent by an admin to a specific user
CREATE TYPE invitation_status AS ENUM (
    'pending',   -- invitation sent, user has not responded yet
    'accepted',  -- user accepted → inserted as approved member
    'declined'   -- user declined
);
```

---

## 1. Universities

Each university is an isolated space: users, communities, and global feeds are all scoped per institution.

```sql
CREATE TABLE universities (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(200) UNIQUE NOT NULL,  -- e.g. "Transilvania University of Brașov"
    domain     VARCHAR(100) UNIQUE NOT NULL   -- e.g. "unitbv.ro"
    -- The domain is used at registration to auto-assign university_id:
    -- if the user's email ends with "@unitbv.ro" → correct university is set automatically.
);
```

---

## 2. Users

Student accounts. Each user belongs to exactly one university.

```sql
CREATE TABLE users (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id   UUID         NOT NULL REFERENCES universities(id),
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50)  UNIQUE NOT NULL,
    password_hash   TEXT         NOT NULL,
    avatar_key      TEXT,        -- MinIO object key (bucket: profile-pictures), e.g. "a1b2c3.webp"
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Used frequently: filter users by university during validation and stats
CREATE INDEX idx_users_university ON users(university_id);
```

---

## 3. Communities

The social hubs of the application. Each community belongs to a university and has an access type that drives the join logic.

```sql
CREATE TABLE communities (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id   UUID           NOT NULL REFERENCES universities(id),
    owner_id        UUID           NOT NULL REFERENCES users(id),
    name            VARCHAR(100)   NOT NULL,
    description     TEXT,
    type            community_type NOT NULL DEFAULT 'public',

    -- Can only be toggled by the community admin.
    -- If TRUE, posts with author_id = NULL are allowed.
    -- If FALSE, author_id = NULL is rejected at the application layer.
    allow_anonymous BOOLEAN        NOT NULL DEFAULT FALSE,

    icon_key        TEXT,          -- MinIO object key (bucket: communities), e.g. "e5f6g7.png"
    banner_key      TEXT,          -- MinIO object key (bucket: communities), e.g. "h8i9j0.jpg"
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    -- The same community name can exist at different universities
    -- e.g. "Year 2 CS" can exist at both UniTBV and UBB
    UNIQUE (university_id, name)
);

-- Global feed filters by university_id + type='public' frequently
CREATE INDEX idx_communities_university_type ON communities(university_id, type);
```

---

## 4. Community Members

Many-to-many join table between users and communities. Handles membership, join request status, and admin role.

```sql
CREATE TABLE community_members (
    user_id      UUID          NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    community_id UUID          NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

    -- type='public'  → status='approved' set automatically on join
    -- type='request' → status='pending' until admin makes a decision
    -- type='invite'  → status='approved' set automatically after accepting invitation
    status       member_status NOT NULL DEFAULT 'approved',

    -- Admin can: approve/reject join requests, toggle anonymous posts,
    -- manage invite links and direct invitations
    is_admin     BOOLEAN       NOT NULL DEFAULT FALSE,

    joined_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, community_id)
);

-- Partial index: most frequent query — "approved communities of user X"
-- Used by the personalized feed and access control checks
CREATE INDEX idx_members_user_approved
    ON community_members(user_id)
    WHERE status = 'approved';

-- Used by: admin listing all members of a community
CREATE INDEX idx_members_community ON community_members(community_id, status);
```

---

## 5. Community Invite Links

Public links with a code for communities of type `invite`. Anyone who has the link can join (within the configured constraints). Kept separate from communities to support: revocation, expiry, usage limits.

```sql
CREATE TABLE community_invite_links (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_by   UUID        NOT NULL REFERENCES users(id),
    code         VARCHAR(32) UNIQUE NOT NULL,  -- randomly generated in the app (e.g. nanoid)

    -- Optional per-link configuration:
    expires_at   TIMESTAMPTZ,  -- NULL = link never expires
    max_uses     INT,          -- NULL = unlimited uses
    use_count    INT           NOT NULL DEFAULT 0,

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()

    -- Flow when accessing /invite/{code}:
    --   1. Check: expires_at < NOW() → reject
    --   2. Check: use_count >= max_uses → reject (only if max_uses IS NOT NULL)
    --   3. INSERT INTO community_members (status='approved')
    --   4. UPDATE community_invite_links SET use_count = use_count + 1
);
```

---

## 6. Community Invitations

Direct (nominal) invitations: admin explicitly invites a specific platform user. Different from invite links (which are public) — these are personal.

```sql
CREATE TABLE community_invitations (
    id           UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID               NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    invited_by   UUID               NOT NULL REFERENCES users(id),
    invited_user UUID               NOT NULL REFERENCES users(id),
    status       invitation_status  NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    -- A user cannot be invited twice to the same community
    UNIQUE (community_id, invited_user)

    -- Flow:
    --   Admin: INSERT → status='pending'
    --   User accepts: UPDATE status='accepted'
    --               + INSERT INTO community_members (status='approved')
    --   User declines: UPDATE status='declined'
);

-- Used by: "pending invitations for user X" (notifications)
CREATE INDEX idx_invitations_user_pending
    ON community_invitations(invited_user)
    WHERE status = 'pending';
```

---

## 7. Community Join Questions

Questions defined by the admin that a user must answer before submitting a join request. Only relevant for communities of type `request`.

```sql
CREATE TABLE community_join_questions (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID         NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    question     VARCHAR(300) NOT NULL,
    is_required  BOOLEAN      NOT NULL DEFAULT TRUE,  -- if FALSE, the field is optional
    order_index  SMALLINT     NOT NULL DEFAULT 0       -- controls display order in the form
);

-- Used by: loading the join request form in the correct order
CREATE INDEX idx_join_questions_community ON community_join_questions(community_id, order_index);
```

---

## 8. Community Join Answers

A user's answers to the questions above. Submitted simultaneously with the join request (`community_members` pending row). Admin sees them grouped alongside the request to make an informed decision.

```sql
CREATE TABLE community_join_answers (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID        NOT NULL REFERENCES community_join_questions(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer      TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A user can answer each question only once
    UNIQUE (question_id, user_id)
);

-- Used by: admin loading all answers submitted by a user for a community
CREATE INDEX idx_join_answers_user ON community_join_answers(user_id);
```

---

## 9. Posts

The primary content of the application. Belongs to a community. `author_id = NULL` means anonymous post — no separate `is_anonymous` column to avoid contradictory states (e.g. `author_id` SET + `is_anonymous = TRUE`).

```sql
CREATE TABLE posts (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID         NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

    -- NULL     → anonymous post (only allowed if communities.allow_anonymous = TRUE)
    -- NOT NULL → post with a visible author
    -- ON DELETE SET NULL: if the user deletes their account, posts remain but become anonymous
    author_id    UUID         REFERENCES users(id) ON DELETE SET NULL,

    title        VARCHAR(300) NOT NULL,
    body         TEXT,         -- optional: a post can be title + image only
    image_key    TEXT,         -- MinIO object key (bucket: posts), e.g. "m3n4o5.jpg"

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  -- NULL if the post has never been edited

    -- Score is NOT stored here — calculated dynamically:
    -- SELECT COALESCE(SUM(value), 0) AS score FROM votes WHERE post_id = $1
    -- Advantage: zero inconsistency. Tradeoff: JOIN on every feed query.
    -- If it becomes slow (>100k votes/post), add a score column + trigger THEN, not now.
);

-- Community feed: sort by date (newest first)
CREATE INDEX idx_posts_community_new    ON posts(community_id, created_at DESC);

-- Global feed: all recent posts (JOINed with communities to filter by university)
CREATE INDEX idx_posts_created_global   ON posts(created_at DESC);

-- Quick lookup of posts by a specific author (user profile page)
CREATE INDEX idx_posts_author           ON posts(author_id) WHERE author_id IS NOT NULL;
```

---

## 10. Votes

Upvote (`+1`) and downvote (`-1`) on posts. `PRIMARY KEY (user_id, post_id)` guarantees one vote per user per post. Changing a vote = `UPDATE value`, not a new `INSERT`.

```sql
CREATE TABLE votes (
    user_id    UUID     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    post_id    UUID     NOT NULL REFERENCES posts(id)  ON DELETE CASCADE,

    -- 1 = upvote, -1 = downvote
    value      SMALLINT NOT NULL CHECK (value IN (1, -1)),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, post_id)
);

-- Used by: score calculation on posts (SUM aggregation)
CREATE INDEX idx_votes_post ON votes(post_id);
```

---

## Feed Queries

Feeds are not tables — they are parameterized queries.

### Global Feed
Newest posts from public communities of the user's university. `$1 = university_id`

```sql
SELECT p.*, COALESCE(SUM(v.value), 0) AS score
FROM posts p
JOIN communities c ON p.community_id = c.id
LEFT JOIN votes v  ON v.post_id = p.id
WHERE c.university_id = $1
  AND c.type = 'public'
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 50 OFFSET $2;
```

### Personalized Feed
Posts from communities the user is subscribed to. `$1 = user_id`

```sql
SELECT p.*, COALESCE(SUM(v.value), 0) AS score
FROM posts p
JOIN community_members m ON p.community_id = m.community_id
LEFT JOIN votes v         ON v.post_id = p.id
WHERE m.user_id = $1
  AND m.status = 'approved'
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 50 OFFSET $2;
```

### Community Feed
Top posts from a specific community, sorted by score. `$1 = community_id`

```sql
SELECT p.*, COALESCE(SUM(v.value), 0) AS score
FROM posts p
LEFT JOIN votes v ON v.post_id = p.id
WHERE p.community_id = $1
GROUP BY p.id
ORDER BY score DESC
LIMIT 50 OFFSET $2;
```

---

## Summary — 10 Tables, 0 Redundancies

| Table | Role |
|---|---|
| `universities` | Per-institution data isolation |
| `users` | Student accounts |
| `communities` | Social hubs |
| `community_members` | Membership + role + join request status |
| `community_invite_links` | Public code-based links (`type='invite'`) |
| `community_invitations` | Direct admin-to-user nominations (`type='invite'`) |
| `community_join_questions` | Admin-defined questions for join forms (`type='request'`) |
| `community_join_answers` | User's answers submitted with the join request |
| `posts` | Community content |
| `votes` | Upvotes and downvotes on posts |