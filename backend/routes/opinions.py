from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from uuid import UUID
from models import OpinionCreate, OpinionResponse
from database import supabase
from services.scoring import enrich_opinion

router = APIRouter(prefix="/opinions", tags=["Opinions"])

@router.get("", response_model=List[OpinionResponse])
async def get_opinions(
    category_id: Optional[UUID] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    query = supabase.table("opinions").select("*").order("created_at", desc=True).limit(limit).offset(offset)
    
    if category_id:
        query = query.eq("category_id", str(category_id))
        
    res = query.execute()
    return [enrich_opinion(op) for op in res.data]

@router.get("/{opinion_id}", response_model=OpinionResponse)
async def get_opinion(opinion_id: UUID):
    res = supabase.table("opinions").select("*").eq("id", str(opinion_id)).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Opinion not found")
        
    return enrich_opinion(res.data[0])

@router.post("", status_code=status.HTTP_201_CREATED, response_model=OpinionResponse)
async def create_opinion(opinion: OpinionCreate):
    # 1. Validate category exists
    cat_res = supabase.table("categories").select("id").eq("id", str(opinion.category_id)).execute()
    if not cat_res.data:
        raise HTTPException(status_code=400, detail="Invalid category_id")

    # 2. Convert UUID to string for Supabase payload
    data = opinion.model_dump()
    data["category_id"] = str(data["category_id"])

    # 3. Insert and return
    res = supabase.table("opinions").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create opinion")
        
    return enrich_opinion(res.data[0])
