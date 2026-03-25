from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta, timezone

from database import supabase
from models import ScoreResponse, OpinionResponse
from services.scoring import compute_user_score, compute_opinion_stats

router = APIRouter()


@router.get("/{device_id}", response_model=ScoreResponse)
def get_score(device_id: str):
    """
    Return a user's Contrarian Score and tier based on their device_id.

    The frontend stores device_id in localStorage (lib/identity.ts).
    We look up all opinions the user has posted by joining through the votes
    table where device_id matches — but since opinions store anonymous_name
    we use a simpler approach: fetch votes by device_id, extract opinion_ids,
    then fetch those opinions.
    """
    # 1. Find all opinion_ids this device has authored
    #    (opinions don't store device_id directly; we find them via votes
    #     cast by this device — but that finds opinions they voted ON, not authored.
    #     The correct approach is to store device_id on the opinion row at creation.
    #     We assume that column exists as `author_device_id`.)
    authored = (
        supabase.table("opinions")
        .select("id, anonymous_name, avatar_seed, votes_unpopular, votes_common")
        .eq("author_device_id", device_id)
        .execute()
    )

    if not authored.data:
        raise HTTPException(
            status_code=404,
            detail="No opinions found for this device. Post something first!",
        )

    opinions = authored.data
    score_data = compute_user_score(opinions)
    first = opinions[0]

    # Compute global rank: count users with a higher score
    # (lightweight approach — works well up to ~10k users)
    all_scores_result = (
        supabase.table("opinions")
        .select("author_device_id, votes_unpopular, votes_common")
        .execute()
    )

    device_scores: dict[str, list] = {}
    for row in all_scores_result.data:
        did = row["author_device_id"]
        if did:
            device_scores.setdefault(did, []).append(row)

    user_score_val = score_data["unpopularity_score"]
    rank = (
        sum(
            1 for did, ops in device_scores.items()
            if did != device_id
            and compute_user_score(ops)["unpopularity_score"] > user_score_val
        )
        + 1
    )

    return ScoreResponse(
        device_id=device_id,
        anonymous_name=first["anonymous_name"],
        avatar_seed=first["avatar_seed"],
        unpopularity_score=score_data["unpopularity_score"],
        tier=score_data["tier"],
        total_opinions=len(opinions),
        qualifying_opinions=score_data["qualifying_opinions"],
        rank=rank,
    )


@router.get("/{device_id}/opinions", response_model=list[OpinionResponse])
def get_user_opinions(
    device_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Return all opinions posted by this device_id — used on the Profile screen
    to render the user's past takes.
    """
    result = (
        supabase.table("opinions")
        .select("*")
        .eq("author_device_id", device_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )

    opinions = []
    for row in result.data:
        stats = compute_opinion_stats(row["votes_unpopular"], row["votes_common"])
        opinions.append(OpinionResponse(
            id=row["id"],
            content=row["content"],
            category_id=row["category_id"],
            anonymous_name=row["anonymous_name"],
            avatar_seed=row["avatar_seed"],
            votes_unpopular=row["votes_unpopular"],
            votes_common=row["votes_common"],
            total_votes=stats["total_votes"],
            unpopularity_pct=stats["unpopularity_pct"],
            tier=stats["tier"],
            created_at=row["created_at"],
        ))
    return opinions
