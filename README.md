# Contrarian

A web social app where users anonymously post opinions and the crowd votes whether it's actually unpopular or surprisingly common. Built with **React + Vite**, **FastAPI**, and **Supabase**. The more people disagree with you, the higher your Contrarian Score — making unpopularity the goal.

## Features

* Anonymous identity system — no sign-up, no email, just open and post
* Vote on opinions: **Unpopular 👎** or **Common 👍**
* Live vote counts via Supabase Realtime subscriptions
* Contrarian Score calculated per user based on unpopularity %
* Weekly leaderboard of the most unpopular takes
* Auto-generated codenames and DiceBear avatars
* Category tagging (Food, Pop Culture, Work, Tech, and more)
* One vote per device per opinion enforced by the backend
* Fully responsive — works on desktop and mobile browser

## Project Structure

```
contrarian/
|-- frontend/
|   |-- src/
|   |   |-- main.tsx
|   |   |-- App.tsx
|   |   |-- pages/
|   |   |   |-- Feed.tsx
|   |   |   |-- Post.tsx
|   |   |   |-- Leaderboard.tsx
|   |   |   `-- Profile.tsx
|   |   |-- components/
|   |   |   |-- OpinionCard.tsx
|   |   |   |-- VoteButtons.tsx
|   |   |   |-- AvatarBadge.tsx
|   |   |   |-- CategoryPill.tsx
|   |   |   `-- ScoreBadge.tsx
|   |   |-- lib/
|   |   |   |-- supabase.ts
|   |   |   |-- api.ts
|   |   |   `-- identity.ts
|   |   `-- index.css
|   |-- .env
|   |-- tailwind.config.js
|   |-- vite.config.ts
|   `-- package.json
|
`-- backend/
    |-- main.py
    |-- models.py
    |-- database.py
    |-- .env
    |-- requirements.txt
    `-- routes/
        |-- opinions.py
        |-- votes.py
        `-- leaderboard.py
```

## Installation

### Prerequisites

* Node.js 18+
* Python 3.10+
* A Supabase project

---

### 1. Clone the repository

```
git clone https://github.com/yourusername/contrarian.git
cd contrarian
```

### 2. Set up Supabase

Run the following SQL in your Supabase SQL editor:

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null
);

insert into categories (name, emoji) values
  ('Food', '🍕'), ('Pop Culture', '🎬'), ('Work', '💼'),
  ('Relationships', '💔'), ('Tech', '💻'), ('Sports', '⚽'), ('Life', '🌀');

create table opinions (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  category_id uuid references categories(id),
  anonymous_name text not null,
  avatar_seed text not null,
  votes_unpopular integer default 0,
  votes_common integer default 0,
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  opinion_id uuid references opinions(id) on delete cascade,
  device_id text not null,
  vote_type text check (vote_type in ('unpopular', 'common')),
  created_at timestamptz default now(),
  unique(opinion_id, device_id)
);

alter publication supabase_realtime add table opinions;
```

### 3. Set up the backend

```
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

### 4. Set up the frontend

```
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

## Usage

### Start the backend

```
cd backend
uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Interactive docs available at `http://localhost:8000/docs`.

### Start the frontend

```
cd frontend
npm run dev
```

App runs at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/opinions` | List all opinions (paginated) |
| `POST` | `/opinions` | Submit a new opinion |
| `GET` | `/opinions/{id}` | Get a single opinion with vote counts |
| `POST` | `/votes` | Cast a vote (`unpopular` or `common`) |
| `GET` | `/leaderboard` | Top 10 most unpopular opinions this week |
| `GET` | `/score/{device_id}` | Get a user's Contrarian Score |

### Contrarian Score Formula

```
score = average of (votes_unpopular / total_votes × 100) across all user opinions
```

Opinions with fewer than 5 total votes are excluded from the score calculation.

## Score Tiers

| Score | Tier |
|-------|------|
| 0 – 30 | Normie |
| 31 – 60 | Edgy |
| 61 – 80 | Based |
| 81 – 100 | Contrarian God |

## Requirements

**Frontend**
* Node.js 18+
* React 18+
* Vite 5+
* Tailwind CSS 3+
* `react-router-dom` v6
* `@supabase/supabase-js`

**Backend**
* Python 3.10+
* `fastapi`
* `uvicorn`
* `supabase`
* `python-dotenv`

## License

For portfolio and educational purposes.
