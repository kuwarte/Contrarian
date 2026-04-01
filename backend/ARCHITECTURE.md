# Contrarian — Backend Architecture

## Overview

The backend is a **FastAPI** application that sits between the React frontend and **Supabase** (PostgreSQL + Realtime). It is a pure REST API — no server-side rendering, no sessions. The frontend drives all UI state; the backend enforces business rules and returns derived data the frontend would otherwise compute incorrectly (tier labels, unpopularity scores, one-vote enforcement).

```
React (Vite)  ──────►  FastAPI  ──────►  Supabase (Postgres)
     ▲                                         │
     └──────────  Supabase Realtime  ◄─────────┘
                 (live vote counts)
```

Supabase Realtime is used **directly from the frontend** for live vote count updates — the FastAPI layer is not in that loop. This keeps the backend thin and stateless.

---

## Directory Structure

```
backend/
├── main.py                  # App factory, CORS, router registration
├── database.py              # Supabase client singleton
├── models.py                # All Pydantic request/response schemas
├── requirements.txt
├── .env                     # SUPABASE_URL, SUPABASE_SERVICE_KEY
│
├── routes/
│   ├── __init__.py
│   ├── opinions.py          # GET/POST /opinions, GET /opinions/{id}
│   ├── votes.py             # POST /votes
│   ├── leaderboard.py       # GET /leaderboard
│   └── score.py             # GET /score/{device_id}, GET /score/{device_id}/opinions
│
├── services/
│   ├── __init__.py
│   └── scoring.py           # Tier logic and score computation (shared)
│
└── migrations/
    └── 001_add_author_device_id.sql
```

### Layer responsibilities

| Layer       | File(s)               | Responsibility                           |
| ----------- | --------------------- | ---------------------------------------- |
| Entry point | `main.py`             | App init, CORS, router mounts            |
| Data access | `database.py`         | Single Supabase client, loaded once      |
| Schemas     | `models.py`           | Input validation + response shape        |
| Routes      | `routes/*.py`         | HTTP handling only — thin controllers    |
| Services    | `services/scoring.py` | Business logic, no HTTP awareness        |
| Migrations  | `migrations/*.sql`    | Schema changes, run manually in Supabase |

---

## API Reference

Base URL (local): `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### Health

| Method | Path      | Description  |
| ------ | --------- | ------------ |
| GET    | `/`       | API status   |
| GET    | `/health` | Health check |

---

### Opinions

#### `GET /opinions`

Returns paginated opinions ordered newest first. Used by the **Feed** screen.

**Query params**

| Param         | Type | Default | Description         |
| ------------- | ---- | ------- | ------------------- |
| `category_id` | UUID | —       | Filter by category  |
| `limit`       | int  | 20      | Max results (1–100) |
| `offset`      | int  | 0       | Pagination offset   |

**Response** `200 OpinionResponse[]`

```json
[
	{
		"id": "uuid",
		"content": "Dark mode is overrated.",
		"category_id": "uuid",
		"anonymous_name": "GhostFox-44",
		"avatar_seed": "ghostfox44",
		"votes_unpopular": 234,
		"votes_common": 41,
		"total_votes": 275,
		"unpopularity_pct": 85.1,
		"tier": "Contrarian God",
		"created_at": "2025-03-25T10:00:00Z"
	}
]
```

---

#### `GET /opinions/{opinion_id}`

Single opinion with live counts. Used when deep-linking to a specific take.

**Response** `200 OpinionResponse` | `404`

---

#### `POST /opinions`

Submit a new opinion. The frontend generates `anonymous_name` and `avatar_seed` via `lib/identity.ts` before calling this.

**Request body**

```json
{
	"content": "Pineapple belongs on pizza.",
	"category_id": "uuid",
	"anonymous_name": "NeonViper-09",
	"avatar_seed": "neonviper09"
}
```

**Validation rules**

- `content`: 10–500 characters, not blank after trimming
- `category_id`: must exist in the `categories` table
- `anonymous_name`: 1–50 characters
- `avatar_seed`: 1–100 characters

**Response** `201 OpinionResponse` | `400` (invalid category)

---

### Votes

#### `POST /votes`

Cast a vote. The backend enforces **one vote per device per opinion** — duplicate attempts return `409`.

**Request body**

```json
{
	"opinion_id": "uuid",
	"device_id": "device-fingerprint-string",
	"vote_type": "unpopular"
}
```

`vote_type` must be `"unpopular"` or `"common"` — enforced by Pydantic `Literal`.

**What happens server-side**

1. Verify opinion exists → `404` if not
2. Check `votes` table for existing `(opinion_id, device_id)` pair → `409` if found
3. Insert vote record
4. Increment `votes_unpopular` or `votes_common` on the opinion row
5. Return updated counts + derived stats

**Response** `201 VoteResult`

```json
{
	"opinion_id": "uuid",
	"votes_unpopular": 235,
	"votes_common": 41,
	"total_votes": 276,
	"unpopularity_pct": 85.1,
	"tier": "Contrarian God"
}
```

| Status | Meaning           |
| ------ | ----------------- |
| `201`  | Vote recorded     |
| `404`  | Opinion not found |
| `409`  | Already voted     |

---

### Leaderboard

#### `GET /leaderboard`

Top N users ranked by weekly unpopularity score. Used by the **Rankings** screen.

**Query params**

| Param   | Type | Default | Description        |
| ------- | ---- | ------- | ------------------ |
| `limit` | int  | 10      | Max entries (1–50) |

**Scoring algorithm**

1. Fetch all opinions created since Monday 00:00 UTC of the current week
2. Group opinions by `anonymous_name`
3. For each user, compute average `votes_unpopular / total_votes × 100` across qualifying opinions (≥ 5 total votes)
4. Users with no qualifying opinions get a score of 0
5. Sort descending, assign rank

**Response** `200 LeaderboardResponse`

```json
{
	"week_start": "2025-03-24",
	"entries": [
		{
			"rank": 1,
			"anonymous_name": "CitizenZero",
			"avatar_seed": "citizenzero",
			"total_opinions": 5,
			"unpopularity_score": 88.4,
			"tier": "Contrarian God"
		}
	]
}
```

---

### Score

#### `GET /score/{device_id}`

User's personal Contrarian Score and tier. Used by the **Profile** screen stat cards.

**Response** `200 ScoreResponse` | `404`

```json
{
	"device_id": "abc123",
	"anonymous_name": "GhostFox-44",
	"avatar_seed": "ghostfox44",
	"unpopularity_score": 85.1,
	"tier": "Contrarian God",
	"total_opinions": 12,
	"qualifying_opinions": 9,
	"rank": 3
}
```

---

#### `GET /score/{device_id}/opinions`

All opinions posted by this device, paginated. Used by the **Profile** screen "Past Takes" section.

**Query params:** `limit` (default 20), `offset` (default 0)

**Response** `200 OpinionResponse[]`

---

## Score & Tier System

```
unpopularity_pct  =  votes_unpopular / total_votes × 100

Per-opinion tier:
  0  – 30   →  Normie
  31 – 60   →  Edgy
  61 – 80   →  Based
  81 – 100  →  Contrarian God

User score  =  average unpopularity_pct across opinions with ≥ 5 total votes
```

All tier computation lives in `services/scoring.py` — the single source of truth. Both the opinion routes and the leaderboard/score routes call the same functions, so tiers are always consistent.

---

## Database Schema

Run the base schema from the README, then apply migrations in order.

### Base tables (from README)

```sql
categories (id, name, emoji)
opinions   (id, content, category_id, anonymous_name, avatar_seed,
            votes_unpopular, votes_common, created_at)
votes      (id, opinion_id, device_id, vote_type, created_at)
           UNIQUE(opinion_id, device_id)
```

### Migration 001 — `author_device_id`

The profile and score routes need to fetch opinions by the device that posted them. The base schema doesn't include this column.

```bash
# Run in Supabase SQL editor
migrations/001_add_author_device_id.sql
```

```sql
ALTER TABLE opinions ADD COLUMN IF NOT EXISTS author_device_id TEXT;
CREATE INDEX IF NOT EXISTS idx_opinions_author_device ON opinions(author_device_id);
CREATE INDEX IF NOT EXISTS idx_opinions_created_at    ON opinions(created_at DESC);
```

After applying, update `POST /opinions` in `routes/opinions.py` to include `author_device_id` in the insert payload — the frontend must send `device_id` alongside the opinion creation request.

### Supabase Realtime

The `opinions` table is already added to the Realtime publication. The frontend subscribes directly:

```typescript
// lib/supabase.ts (frontend)
supabase
	.channel("opinions")
	.on("postgres_changes", { event: "UPDATE", schema: "public", table: "opinions" }, handler)
	.subscribe();
```

No backend changes needed for Realtime — it bypasses FastAPI entirely.

---

## Environment Variables

**`backend/.env`**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Use the **service role key** (not the anon key) so the backend can bypass Supabase RLS policies. Never expose this key to the frontend.

---

## Running Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # macOS/Linux
.venv\Scripts\activate        # Windows

pip install -r requirements.txt
uvicorn main:app --reload
```

API available at `http://localhost:8000`.
Swagger UI at `http://localhost:8000/docs`.

---

## Frontend Integration Notes

### How the React app calls the backend

All API calls go through `frontend/src/lib/api.ts`. Here's the mapping from React screens to backend endpoints:

| React screen / action | Endpoint                          |
| --------------------- | --------------------------------- |
| Feed loads            | `GET /opinions?limit=20&offset=N` |
| Filter by category    | `GET /opinions?category_id=UUID`  |
| Post Composer submits | `POST /opinions`                  |
| Vote button clicked   | `POST /votes`                     |
| Rankings tab          | `GET /leaderboard`                |
| Profile stat cards    | `GET /score/{device_id}`          |
| Profile past takes    | `GET /score/{device_id}/opinions` |

### Device identity

The frontend generates a stable `device_id` once on first load and stores it in `localStorage` via `lib/identity.ts`. Every API call that needs it (votes, posting opinions, fetching scores) pulls it from there. The backend trusts this value as-is — it is not an auth token, just a fingerprint.

### Vote optimism

After `POST /votes` returns `201 VoteResult`, the frontend should update local state immediately with the returned `votes_unpopular`, `votes_common`, `unpopularity_pct`, and `tier` — no need to refetch the opinion. Supabase Realtime will then confirm the update to all other connected clients.

### Error handling

| Status                  | Frontend action                                |
| ----------------------- | ---------------------------------------------- |
| `409` on vote           | Show "Already voted" state on the vote buttons |
| `400` on opinion create | Show validation error under the textarea       |
| `404`                   | Show empty/not-found state                     |
| `500`                   | Show generic error toast                       |
