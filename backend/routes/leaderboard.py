from fastapi import APIRouter, Query
from datetime import datetime, timedelta, timezone
from models import LeaderboardResponse, LeaderboardEntry
from database import supabase
from services.scoring import calculate_tier

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(limit: int = Query(10, ge=1, le=50)):
    # 1. Determine Monday 00:00 UTC of current week
    now = datetime.now(timezone.utc)
    monday = now - timedelta(days=now.weekday())
    monday_start = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 2. Fetch all opinions from this week
    res = supabase.table("opinions").select("*").gte("created_at", monday_start.isoformat()).execute()
    
    # 3. Group by user and aggregate
    user_stats = {}
    for op in res.data:
        name = op["anonymous_name"]
        seed = op["avatar_seed"]
        total_votes = op["votes_unpopular"] + op["votes_common"]
        
        if name not in user_stats:
            user_stats[name] = {"seed": seed, "total_opinions": 0, "qualifying": []}
        
        user_stats[name]["total_opinions"] += 1
        
        # Only opinions with >= 5 votes qualify for score
        if total_votes >= 5:
            pct = (op["votes_unpopular"] / total_votes) * 100
            user_stats[name]["qualifying"].append(pct)
            
    # 4. Calculate final scores
    entries = []
    for name, stats in user_stats.items():
        score = sum(stats["qualifying"]) / len(stats["qualifying"]) if stats["qualifying"] else 0.0
            
        entries.append({
            "anonymous_name": name,
            "avatar_seed": stats["seed"],
            "total_opinions": stats["total_opinions"],
            "unpopularity_score": round(score, 1),
            "tier": calculate_tier(score)
        })
        
    # 5. Sort descending and assign ranks
    entries.sort(key=lambda x: x["unpopularity_score"], reverse=True)
    entries = entries[:limit]
    
    result = [LeaderboardEntry(rank=i+1, **entry) for i, entry in enumerate(entries)]
        
    return LeaderboardResponse(
        week_start=monday_start.strftime("%Y-%m-%d"),
        entries=result
    )
