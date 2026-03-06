"""Amazon DynamoDB service — persistent storage for users, interactions, medical entities.

Tables:
- Users: PK=userId — profiles, language preferences, role
- Interactions: PK=userId, SK=interactionId — lab reports, care guide sessions, medscribe notes
- MedicalEntities: PK=interactionId, SK=entityId — extracted medical entities
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional
import boto3
from boto3.dynamodb.conditions import Key
from app.config import get_settings

settings = get_settings()
dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)

users_table = dynamodb.Table(settings.dynamodb_users_table)
interactions_table = dynamodb.Table(settings.dynamodb_interactions_table)
entities_table = dynamodb.Table(settings.dynamodb_entities_table)


# ── Users ───────────────────────────────────────────────────────────

async def create_user(user_id: str, profile: dict) -> dict:
    """Create or update a user profile."""
    item = {
        "userId": user_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        **profile,
    }
    await asyncio.to_thread(users_table.put_item, Item=item)
    return item


async def get_user(user_id: str) -> Optional[dict]:
    """Get a user profile by ID."""
    response = await asyncio.to_thread(
        users_table.get_item, Key={"userId": user_id}
    )
    return response.get("Item")


async def update_user(user_id: str, updates: dict) -> dict:
    """Update specific fields on a user profile."""
    update_expr_parts = []
    expr_values = {}
    expr_names = {}

    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()

    for i, (key, value) in enumerate(updates.items()):
        alias = f"#k{i}"
        placeholder = f":v{i}"
        update_expr_parts.append(f"{alias} = {placeholder}")
        expr_names[alias] = key
        expr_values[placeholder] = value

    response = await asyncio.to_thread(
        users_table.update_item,
        Key={"userId": user_id},
        UpdateExpression="SET " + ", ".join(update_expr_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return response.get("Attributes", {})


async def delete_user(user_id: str) -> None:
    """Delete a user profile."""
    await asyncio.to_thread(
        users_table.delete_item, Key={"userId": user_id}
    )


# ── Interactions ────────────────────────────────────────────────────

async def save_interaction(
    user_id: str,
    interaction_type: str,
    data: dict,
    interaction_id: Optional[str] = None,
) -> dict:
    """Save an interaction (lab report, care guide session, medscribe note).

    Args:
        user_id: User ID
        interaction_type: 'lab_report' | 'care_guide' | 'medscribe'
        data: Interaction-specific data (analysis results, SOAP notes, etc.)
        interaction_id: Optional pre-generated ID
    """
    if not interaction_id:
        interaction_id = str(uuid.uuid4())

    item = {
        "userId": user_id,
        "interactionId": interaction_id,
        "type": interaction_type,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    await asyncio.to_thread(interactions_table.put_item, Item=item)
    return item


async def get_interaction(user_id: str, interaction_id: str) -> Optional[dict]:
    """Get a specific interaction."""
    response = await asyncio.to_thread(
        interactions_table.get_item,
        Key={"userId": user_id, "interactionId": interaction_id},
    )
    return response.get("Item")


async def list_interactions(
    user_id: str,
    interaction_type: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    """List interactions for a user, optionally filtered by type."""
    kwargs = {
        "KeyConditionExpression": Key("userId").eq(user_id),
        "ScanIndexForward": False,  # newest first
        "Limit": limit,
    }

    if interaction_type:
        kwargs["FilterExpression"] = Key("type").eq(interaction_type)

    response = await asyncio.to_thread(interactions_table.query, **kwargs)
    return response.get("Items", [])


async def delete_interaction(user_id: str, interaction_id: str) -> None:
    """Delete an interaction."""
    await asyncio.to_thread(
        interactions_table.delete_item,
        Key={"userId": user_id, "interactionId": interaction_id},
    )


# ── Medical Entities ────────────────────────────────────────────────

async def save_medical_entities(
    interaction_id: str,
    entities: list[dict],
) -> list[dict]:
    """Save extracted medical entities for an interaction."""
    items = []
    for entity in entities:
        entity_id = str(uuid.uuid4())
        item = {
            "interactionId": interaction_id,
            "entityId": entity_id,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            **entity,
        }
        items.append(item)

    # Batch write (max 25 per batch)
    for i in range(0, len(items), 25):
        batch = items[i:i + 25]
        await asyncio.to_thread(
            _batch_write_entities, batch
        )

    return items


def _batch_write_entities(items: list[dict]):
    """Batch write entities to DynamoDB."""
    with entities_table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)


async def get_medical_entities(interaction_id: str) -> list[dict]:
    """Get all medical entities for an interaction."""
    response = await asyncio.to_thread(
        entities_table.query,
        KeyConditionExpression=Key("interactionId").eq(interaction_id),
    )
    return response.get("Items", [])


# ── History Endpoint Helpers ────────────────────────────────────────

async def get_user_history(user_id: str, limit: int = 50) -> list[dict]:
    """Get all interactions for a user (for history page)."""
    return await list_interactions(user_id, limit=limit)


async def get_interaction_detail(user_id: str, interaction_id: str) -> Optional[dict]:
    """Get full interaction with its medical entities."""
    interaction = await get_interaction(user_id, interaction_id)
    if not interaction:
        return None

    entities = await get_medical_entities(interaction_id)
    interaction["medical_entities"] = entities
    return interaction
