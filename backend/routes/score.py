from fastapi import APIRouter, HTTPException, Query
from typing import List
from models import ScoreResponse, OpinionResponse
from database import supabase
from services.scoring import enrich_opinion, calculate_tier

router = APIRouter(prefix="/score", tags=["Score"])

@router.get("/{device_id}", response_model=ScoreResponse)
async def get_score(device_id: str):
    res = supabase.table("opinions").select("*").eq("author_device_id", device_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="No opinions found for this device")
        
    ops = res.data
    name = ops[0]["anonymous_name"]
    seed = ops[0]["avatar_seed"]
    
    qualifying = []
    for op in ops:
        total = op["votes_unpopular"] + op["votes_common"]
        if total >= 5:
            qualifying.append((op["votes_unpopular"] / total) * 100)
            
    score = round(sum(qualifying) / len(qualifying), 1) if qualifying else 0.0
    
    return ScoreResponse(
        device_id=device_id,
        anonymous_name=name,
        avatar_seed=seed,
        unpopularity_score=score,
        tier=calculate_tier(score),
        total_opinions=len(ops),
        qualifying_opinions=len(qualifying)
    )

@router.get("/{device_id}/opinions", response_model=List[OpinionResponse])
async def get_user_opinions(
    device_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    res = supabase.table("opinions")\
        .select("*")\
        .eq("author_device_id", device_id)\
        .order("created_at", desc=True)\
        .limit(limit).offset(offset).execute()
    
    return [enrich_opinion(op) for op in res.data]
