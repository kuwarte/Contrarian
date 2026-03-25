# Contrarian

A React Native social app where users anonymously post opinions and the crowd votes whether it's actually unpopular or surprisingly common. Built with **Expo**, **FastAPI**, and **Supabase**. The more people disagree with you, the higher your Contrarian Score — making unpopularity the goal.

## Features

* Anonymous identity system — no sign-up, no email, just open and post
* Vote on opinions: **Unpopular 👎** or **Common 👍**
* Live vote counts via Supabase Realtime subscriptions
* Contrarian Score calculated per user based on unpopularity %
* Weekly leaderboard of the most unpopular takes
* Auto-generated codenames and DiceBear avatars
* Category tagging (Food, Pop Culture, Work, Tech, and more)
* One vote per device per opinion enforced by the backend

## Project Structure

```
contrarian/
|-- app/
|   `-- (tabs)/
|       |-- index.tsx          # Feed screen
|       |-- post.tsx           # Post screen
|       |-- leaderboard.tsx    # Leaderboard screen
|       `-- profile.tsx        # Profile screen
|
|-- components/
|   |-- OpinionCard.tsx
|   |-- VoteButtons.tsx
|   |-- AvatarBadge.tsx
|   |-- CategoryPill.tsx
|   `-- ScoreBadge.tsx
|
|-- lib/
|   |-- supabase.ts            # Supabase client
|   |-- api.ts                 # FastAPI calls
|   `-- identity.ts            # Anonymous identity helpers
|
|-- backend/
|   |-- main.py                # FastAPI entry point
|   |-- models.py
|   |-- database.py            # Supabase-py client
|   `-- routes/
|       |-- opinions.py
|       |-- votes.py
|       `-- leaderboard.py
|
|-- assets/
|-- .env
|-- requirements.txt
|-- package.json
`-- README.md
```

## Installation

### Prerequisites

* Node.js 18+
* Python 3.10+
* Expo CLI
* A Supabase project

---

### 1. Clone the repository

```
git clone https://github.com/yourusername/contrarian.git
cd contrarian
```

### 2. Set up Supabase

Run the following SQL in your Supabase SQL editor to create the schema:

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

### 3. Configure environment variables

Create a `.env` file in the root:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Create a `.env` file inside `backend/`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

### 4. Install frontend dependencies

```
npm install
npx expo install expo-router react-native-svg expo-device
npx expo install react-native-reanimated react-native-gesture-handler
```

### 5. Set up the Python backend

```
cd backend
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
.venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

## Usage

### Start the FastAPI backend

```
cd backend
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`.

### Start the Expo app

```
npx expo start
```

Scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

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
* Expo SDK 51+
* `@supabase/supabase-js`
* `react-native-reanimated`
* `expo-router`

**Backend**
* Python 3.10+
* `fastapi`
* `uvicorn`
* `supabase`
* `python-dotenv`

## License

For portfolio and educational purposes.
