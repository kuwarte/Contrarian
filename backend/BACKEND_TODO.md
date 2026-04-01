Contrarian Backend Implementation Plan

Project Structure

backend/
├── main.py # FastAPI app factory & middleware
├── database.py # Supabase client singleton
├── models.py # Pydantic schemas (Request/Response)
├── .env # API Keys (SUPABASE_URL, SUPABASE_SERVICE_KEY)
├── requirements.txt # fastpi, uvicorn, supabase, python-dotenv
│
├── routes/
│ ├── **init**.py # Router exports
│ ├── opinions.py # GET/POST /opinions
│ ├── votes.py # POST /votes (One-vote logic)
│ ├── leaderboard.py # GET /leaderboard (Weekly logic)
│ └── score.py # GET /score/{device_id}
│
├── services/
│ ├── **init**.py
│ └── scoring.py # Tier & Score calculation logic
│
└── migrations/
├── 000_base_schema.sql
└── 001_voting_and_rpc.sql

Implementation Checklist

Phase 1: Environment & DB (The Foundation)

[ ] Create requirements.txt with fastapi, uvicorn[standard], supabase, python-dotenv.
[ ] Initialize Supabase project and get API keys.
[ ] Create .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY.
[ ] Run Step 1: SQL Migration (see below) in Supabase SQL Editor.
[ ] Setup database.py to export the supabase client.

Phase 2: Data Models (The Contract)

[ ] Define OpinionBase, OpinionCreate, and OpinionResponse in models.py.
[ ] Define VoteRequest and VoteResult in models.py.
[ ] Implement the scoring.py service to compute Normie vs Contrarian God tiers.

Phase 3: Core API Routes
[ ] Opinions: Implement GET /opinions (paginated) and POST /opinions.
[ ] Votes: Implement POST /votes with conflict handling (409 Already Voted).
[ ] Profile: Implement GET /score/{device_id} to fetch user stats.

Phase 4: Business Logic
[ ] Leaderboard: Implement the Weekly Average logic in routes/leaderboard.py.
[ ] Security: Add CORS middleware in main.py to allow your frontend URL.

Step 1: SQL Migration (Run in Supabase)Run this code in the SQL Editor tab of your Supabase dashboard to set up the tables and the atomic increment function.

```sql
-- TABLES
CREATE TABLE IF NOT EXISTS public.categories (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
emoji TEXT
);

CREATE TABLE IF NOT EXISTS public.opinions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
content TEXT NOT NULL,
category_id UUID REFERENCES public.categories(id),
author_device_id TEXT NOT NULL,
anonymous_name TEXT NOT NULL,
avatar_seed TEXT NOT NULL,
votes_unpopular INTEGER DEFAULT 0,
votes_common INTEGER DEFAULT 0,
created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.votes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
opinion_id UUID REFERENCES public.opinions(id) ON DELETE CASCADE,
device_id TEXT NOT NULL,
vote_type TEXT NOT NULL CHECK (vote_type IN ('unpopular', 'common')),
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(opinion_id, device_id) -- ENFORCES ONE VOTE PER DEVICE
);

-- ATOMIC INCREMENT FUNCTION
CREATE OR REPLACE FUNCTION increment_vote(row_id UUID, column_name TEXT)
RETURNS VOID AS $$
BEGIN
EXECUTE format('UPDATE opinions SET %I = %I + 1 WHERE id = %L',
column_name, column_name, row_id);
END;
$$ LANGUAGE plpgsql;

-- INDEXES FOR SPEED
CREATE INDEX idx_opinions_author ON opinions(author_device_id);
CREATE INDEX idx_votes_device ON votes(device_id);

-- SEED CATEGORIES
INSERT INTO categories (name, emoji) VALUES
('Food', '🍕'), ('Tech', '💻'), ('Gaming', '🎮'), ('Movies', '🎬'), ('Music', '🎵');
```
