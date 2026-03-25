from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


# ─── CATEGORY ────────────────────────────────────────────────────────────────

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    emoji: str


# ─── OPINION ─────────────────────────────────────────────────────────────────

class OpinionCreate(BaseModel):
    content: str = Field(..., min_length=10, max_length=500)
    category_id: UUID
    anonymous_name: str = Field(..., min_length=1, max_length=50)
    avatar_seed: str = Field(..., min_length=1, max_length=100)

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be blank.")
        return v.strip()


class OpinionResponse(BaseModel):
    id: UUID
    content: str
    category_id: UUID
    anonymous_name: str
    avatar_seed: str
    votes_unpopular: int
    votes_common: int
    total_votes: int
    unpopularity_pct: float          # 0.0 – 100.0, rounded to 1 decimal
    tier: str                        # Normie | Edgy | Based | Contrarian God
    created_at: datetime

    class Config:
        from_attributes = True


# ─── VOTE ─────────────────────────────────────────────────────────────────────

class VoteCreate(BaseModel):
    opinion_id: UUID
    device_id: str = Field(..., min_length=1, max_length=200)
    vote_type: Literal["unpopular", "common"]


class VoteResponse(BaseModel):
    id: UUID
    opinion_id: UUID
    device_id: str
    vote_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class VoteResult(BaseModel):
    """Returned after a successful vote — gives the frontend updated counts immediately."""
    opinion_id: UUID
    votes_unpopular: int
    votes_common: int
    total_votes: int
    unpopularity_pct: float
    tier: str


# ─── LEADERBOARD ──────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    anonymous_name: str
    avatar_seed: str
    total_opinions: int
    unpopularity_score: float        # average unpopularity % across qualifying opinions
    tier: str


class LeaderboardResponse(BaseModel):
    week_start: str                  # ISO date string for the current week
    entries: list[LeaderboardEntry]


# ─── SCORE ────────────────────────────────────────────────────────────────────

class ScoreResponse(BaseModel):
    device_id: str
    anonymous_name: Optional[str]
    avatar_seed: Optional[str]
    unpopularity_score: float
    tier: str
    total_opinions: int
    qualifying_opinions: int         # opinions with >= 5 votes counted in score
    rank: Optional[int]              # global rank, None if not enough data
