from fastapi import APIRouter, HTTPException, status
from models import VoteRequest, VoteResult
from database import supabase
from services.scoring import calculate_stats

router = APIRouter(prefix="/votes", tags=["Votes"])

@router.post("", status_code=status.HTTP_201_CREATED, response_model=VoteResult)
async def cast_vote(vote: VoteRequest):
    # 1. Ensure the opinion exists
    op_res = supabase.table("opinions").select("id").eq("id", str(vote.opinion_id)).execute()
    if not op_res.data:
        raise HTTPException(status_code=404, detail="Opinion not found")

    # 2. Insert the vote (Database constraint prevents duplicates)
    try:
        supabase.table("votes").insert({
            "opinion_id": str(vote.opinion_id),
            "device_id": vote.device_id,
            "vote_type": vote.vote_type
        }).execute()
    except Exception as e:
        error_msg = str(e).lower()
        if "unique" in error_msg or "duplicate" in error_msg or "23505" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already voted")
        raise HTTPException(status_code=400, detail=str(e))

    # 3. Atomic increment via RPC function
    col = "votes_unpopular" if vote.vote_type == "unpopular" else "votes_common"
    supabase.rpc("increment_vote", {"row_id": str(vote.opinion_id), "column_name": col}).execute()

    # 4. Fetch the updated row to get correct derived stats
    updated = supabase.table("opinions").select("*").eq("id", str(vote.opinion_id)).single().execute()
    total, pct, tier = calculate_stats(updated.data["votes_unpopular"], updated.data["votes_common"])

    return {
        "opinion_id": vote.opinion_id,
        "votes_unpopular": updated.data["votes_unpopular"],
        "votes_common": updated.data["votes_common"],
        "total_votes": total,
        "unpopularity_pct": pct,
        "tier": tier
    }
