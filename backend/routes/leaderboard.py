from fastapi import APIRouter, Query
from datetime import datetime, timedelta, timezone

from database import supabase
from models import LeaderboardEntry, LeaderboardResponse
from services.scoring import compute_user_score

router = APIRouter()


def _get_week_start() -> datetime:
    """Return the Monday 00:00 UTC of the current week."""
    today = datetime.now(timezone.utc)
    return today - timedelta(days=today.weekday())


@router.get("", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = Query(10, ge=1, le=50)):
    """
    Top N users ranked by weekly unpopularity score.

    Algorithm:
    1. Fetch all opinions created this week.
    2. Group by anonymous_name + avatar_seed.
    3. Use scoring service to compute each user's average unpopularity %.
    4. Exclude opinions with < 5 votes from score calculation.
    5. Return sorted descending, with rank added.

    This runs in Python rather than a DB function so the scoring logic
    stays in one place (services/scoring.py).
    """
    week_start = _get_week_start()

    opinions = (
        supabase.table("opinions")
        .select("anonymous_name, avatar_seed, votes_unpopular, votes_common")
        .gte("created_at", week_start.isoformat())
        .execute()
    )

    # Group opinions by user identity (anonymous_name is the stable key here;
    # in production you'd key by device_id stored on the opinion row)
    user_map: dict[str, dict] = {}
    for row in opinions.data:
        key = row["anonymous_name"]
        if key not in user_map:
            user_map[key] = {
                "anonymous_name": row["anonymous_name"],
                "avatar_seed": row["avatar_seed"],
                "opinions": [],
            }
        user_map[key]["opinions"].append(row)

    entries = []
    for user in user_map.values():
        score_data = compute_user_score(user["opinions"])
        entries.append({
            "anonymous_name": user["anonymous_name"],
            "avatar_seed": user["avatar_seed"],
            "total_opinions": len(user["opinions"]),
            **score_data,
        })

    # Sort by unpopularity_score descending, then add rank
    entries.sort(key=lambda e: e["unpopularity_score"], reverse=True)
    ranked = [
        LeaderboardEntry(rank=i + 1, **entry)
        for i, entry in enumerate(entries[:limit])
    ]

    return LeaderboardResponse(
        week_start=week_start.date().isoformat(),
        entries=ranked,
    )
