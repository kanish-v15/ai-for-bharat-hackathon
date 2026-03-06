from fastapi import APIRouter, HTTPException, Query
from app.services.dynamodb_service import (
    get_user_history,
    get_interaction_detail,
    delete_interaction,
)

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/{user_id}")
async def list_history(
    user_id: str,
    type: str = Query(None, description="Filter by type: lab_report, care_guide, medscribe"),
    limit: int = Query(20, ge=1, le=100),
):
    """Get interaction history for a user."""
    from app.services.dynamodb_service import list_interactions
    items = await list_interactions(user_id, interaction_type=type, limit=limit)
    return {"items": items, "count": len(items)}


@router.get("/{user_id}/{interaction_id}")
async def get_history_detail(user_id: str, interaction_id: str):
    """Get a specific interaction with medical entities."""
    item = await get_interaction_detail(user_id, interaction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Interaction not found.")
    return item


@router.delete("/{user_id}/{interaction_id}")
async def delete_history_item(user_id: str, interaction_id: str):
    """Delete an interaction."""
    await delete_interaction(user_id, interaction_id)
    return {"status": "deleted"}
