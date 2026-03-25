from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class OpinionCreate(BaseModel):
    content: str
    category_id: UUID
    anonymous_name: str
    avatar_seed: str


class OpinionResponse(BaseModel):
    id: UUID
    content: str
    category_id: UUID
    anonymous_name: str
    avatar_seed: str
    votes_unpopular: int
    votes_common: int
    created_at: datetime

    class Config:
        from_attributes = True


class VoteCreate(BaseModel):
    opinion_id: UUID
    device_id: str
    vote_type: str  # "unpopular" or "common"


class VoteResponse(BaseModel):
    id: UUID
    opinion_id: UUID
    device_id: str
    vote_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    id: UUID
    anonymous_name: str
    avatar_seed: str
    total_opinions: int
    unpopularity_score: float
