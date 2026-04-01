from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from uuid import UUID

# --- Opinions ---
class OpinionBase(BaseModel):
    content: str = Field(..., min_length=10, max_length=500)
    category_id: UUID
    anonymous_name: str = Field(..., min_length=1, max_length=50)
    avatar_seed: str = Field(..., min_length=1, max_length=100)

class OpinionCreate(OpinionBase):
    author_device_id: str = Field(..., min_length=1)

class OpinionResponse(OpinionBase):
    id: UUID
    votes_unpopular: int
    votes_common: int
    total_votes: int
    unpopularity_pct: float
    tier: str
    created_at: datetime

# --- Votes ---
class VoteRequest(BaseModel):
    opinion_id: UUID
    device_id: str
    vote_type: Literal["unpopular", "common"]

class VoteResult(BaseModel):
    opinion_id: UUID
    votes_unpopular: int
    votes_common: int
    total_votes: int
    unpopularity_pct: float
    tier: str

# --- Leaderboard ---
class LeaderboardEntry(BaseModel):
    rank: int
    anonymous_name: str
    avatar_seed: str
    total_opinions: int
    unpopularity_score: float
    tier: str

class LeaderboardResponse(BaseModel):
    week_start: str
    entries: List[LeaderboardEntry]

# --- Scores ---
class ScoreResponse(BaseModel):
    device_id: str
    anonymous_name: str
    avatar_seed: str
    unpopularity_score: float
    tier: str
    total_opinions: int
    qualifying_opinions: int
    rank: Optional[int] = None
