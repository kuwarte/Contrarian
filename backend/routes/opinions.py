from fastapi import APIRouter, HTTPException, Query
from uuid import UUID

from database import supabase
from models import OpinionCreate, OpinionResponse
from services.scoring import compute_opinion_stats

router = APIRouter()


def _format_opinion(row: dict) -> OpinionResponse:
    stats = compute_opinion_stats(row["votes_unpopular"], row["votes_common"])
    return OpinionResponse(
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
    )


@router.get("", response_model=list[OpinionResponse])
def list_opinions(
    category_id: UUID | None = Query(None, description="Filter by category UUID"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Return paginated opinions ordered newest first.
    Optionally filter by category_id.
    Used by the Feed screen.
    """
    query = (
        supabase.table("opinions")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
    )
    if category_id:
        query = query.eq("category_id", str(category_id))

    result = query.execute()
    return [_format_opinion(row) for row in result.data]


@router.get("/{opinion_id}", response_model=OpinionResponse)
def get_opinion(opinion_id: UUID):
    """
    Return a single opinion with live vote counts.
    Used when navigating directly to an opinion.
    """
    result = (
        supabase.table("opinions")
        .select("*")
        .eq("id", str(opinion_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Opinion not found.")
    return _format_opinion(result.data)


@router.post("", response_model=OpinionResponse, status_code=201)
def create_opinion(payload: OpinionCreate):
    """
    Submit a new opinion.
    The frontend generates anonymous_name and avatar_seed via lib/identity.ts.
    """
    # Validate category exists
    cat = (
        supabase.table("categories")
        .select("id")
        .eq("id", str(payload.category_id))
        .maybe_single()
        .execute()
    )
    if not cat.data:
        raise HTTPException(status_code=400, detail="Invalid category_id.")

    insert_data = {
        "content": payload.content,
        "category_id": str(payload.category_id),
        "anonymous_name": payload.anonymous_name,
        "avatar_seed": payload.avatar_seed,
        "votes_unpopular": 0,
        "votes_common": 0,
    }
    result = supabase.table("opinions").insert(insert_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create opinion.")
    return _format_opinion(result.data[0])
