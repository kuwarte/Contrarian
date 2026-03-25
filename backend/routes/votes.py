from fastapi import APIRouter, HTTPException

from database import supabase
from models import VoteCreate, VoteResult
from services.scoring import compute_opinion_stats

router = APIRouter()


@router.post("", response_model=VoteResult, status_code=201)
def cast_vote(payload: VoteCreate):
    """
    Cast a vote on an opinion.

    Rules enforced here (not just in the DB):
    - One vote per device per opinion (unique constraint on opinions_id + device_id).
    - vote_type must be 'unpopular' or 'common' (validated by Pydantic Literal).

    Returns updated vote counts immediately so the frontend can update
    the heat bar without a second round-trip.
    """
    opinion_id = str(payload.opinion_id)

    # 1. Check opinion exists
    op = (
        supabase.table("opinions")
        .select("id, votes_unpopular, votes_common")
        .eq("id", opinion_id)
        .single()
        .execute()
    )
    if not op.data:
        raise HTTPException(status_code=404, detail="Opinion not found.")

    # 2. Check for duplicate vote
    existing = (
        supabase.table("votes")
        .select("id")
        .eq("opinion_id", opinion_id)
        .eq("device_id", payload.device_id)
        .maybe_single()
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail="You have already voted on this opinion.",
        )

    # 3. Insert vote record
    supabase.table("votes").insert({
        "opinion_id": opinion_id,
        "device_id": payload.device_id,
        "vote_type": payload.vote_type,
    }).execute()

    # 4. Increment the correct counter on the opinion
    column = (
        "votes_unpopular" if payload.vote_type == "unpopular" else "votes_common"
    )
    updated = (
        supabase.table("opinions")
        .update({column: op.data[column] + 1})
        .eq("id", opinion_id)
        .execute()
    )
    row = updated.data[0]
    stats = compute_opinion_stats(row["votes_unpopular"], row["votes_common"])

    return VoteResult(
        opinion_id=row["id"],
        votes_unpopular=row["votes_unpopular"],
        votes_common=row["votes_common"],
        total_votes=stats["total_votes"],
        unpopularity_pct=stats["unpopularity_pct"],
        tier=stats["tier"],
    )
