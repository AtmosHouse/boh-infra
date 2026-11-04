"""API routes for ingredient management and parsing."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.db.models import Ingredient as IngredientModel
from app.db.models import IngredientInstance as IngredientInstanceModel
from app.models.ingredients import (
    IngredientCreate,
    IngredientUpdate,
    IngredientResponse,
    IngredientInstanceCreate,
    IngredientInstanceUpdate,
    IngredientInstanceResponse,
    ParseIngredientsRequest,
    ParseIngredientsResponse,
    ParsedIngredientItem,
)
from app.services.ingredient_parser import IngredientParserService
from app.services.unit_normalizer import unit_normalizer

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


# =============================================================================
# Ingredient CRUD Endpoints
# =============================================================================

@router.post("/", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    ingredient: IngredientCreate,
    db: AsyncSession = Depends(get_db),
) -> IngredientResponse:
    """Create a new ingredient."""
    # Normalize unit
    normalized_unit = unit_normalizer.normalize(ingredient.unit)

    db_ingredient = IngredientModel(
        name=ingredient.name.lower().strip(),
        store_id=ingredient.store_id,
        unit=normalized_unit,
    )
    db.add(db_ingredient)
    await db.flush()

    # Re-fetch with store relationship loaded
    query = (
        select(IngredientModel)
        .options(selectinload(IngredientModel.store))
        .where(IngredientModel.id == db_ingredient.id)
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.get("/", response_model=list[IngredientResponse])
async def list_ingredients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> list[IngredientResponse]:
    """List all ingredients, optionally filtered by search term."""
    query = select(IngredientModel).options(
        selectinload(IngredientModel.store)
    ).offset(skip).limit(limit)

    if search:
        query = query.where(IngredientModel.name.ilike(f"%{search}%"))

    query = query.order_by(IngredientModel.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient(
    ingredient_id: int,
    db: AsyncSession = Depends(get_db),
) -> IngredientResponse:
    """Get a specific ingredient by ID."""
    query = (
        select(IngredientModel)
        .options(selectinload(IngredientModel.store))
        .where(IngredientModel.id == ingredient_id)
    )
    result = await db.execute(query)
    ingredient = result.scalar_one_or_none()

    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient with id {ingredient_id} not found",
        )
    return ingredient


@router.put("/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: int,
    ingredient_update: IngredientUpdate,
    db: AsyncSession = Depends(get_db),
) -> IngredientResponse:
    """Update an ingredient."""
    query = select(IngredientModel).options(
        selectinload(IngredientModel.store)
    ).where(IngredientModel.id == ingredient_id)
    result = await db.execute(query)
    ingredient = result.scalar_one_or_none()

    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient with id {ingredient_id} not found",
        )

    update_data = ingredient_update.model_dump(exclude_unset=True)
    if "unit" in update_data and update_data["unit"]:
        update_data["unit"] = unit_normalizer.normalize(update_data["unit"])
    if "name" in update_data and update_data["name"]:
        update_data["name"] = update_data["name"].lower().strip()

    for field, value in update_data.items():
        setattr(ingredient, field, value)

    await db.flush()
    # Re-fetch with store relationship loaded
    query = select(IngredientModel).options(
        selectinload(IngredientModel.store)
    ).where(IngredientModel.id == ingredient_id)
    result = await db.execute(query)
    ingredient = result.scalar_one()
    return ingredient


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(
    ingredient_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an ingredient."""
    query = select(IngredientModel).where(IngredientModel.id == ingredient_id)
    result = await db.execute(query)
    ingredient = result.scalar_one_or_none()

    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient with id {ingredient_id} not found",
        )

    await db.delete(ingredient)
    await db.flush()



# =============================================================================
# Ingredient Instance Endpoints
# =============================================================================

@router.post("/instances", response_model=IngredientInstanceResponse,
             status_code=status.HTTP_201_CREATED)
async def create_ingredient_instance(
    instance: IngredientInstanceCreate,
    db: AsyncSession = Depends(get_db),
) -> IngredientInstanceResponse:
    """Create a new ingredient instance for a dish."""
    db_instance = IngredientInstanceModel(
        ingredient_id=instance.ingredient_id,
        dish_id=instance.dish_id,
        quantity=instance.quantity,
        notes=instance.notes,
    )
    db.add(db_instance)
    await db.flush()

    # Reload with ingredient and store relationships
    query = (
        select(IngredientInstanceModel)
        .where(IngredientInstanceModel.id == db_instance.id)
        .options(
            selectinload(IngredientInstanceModel.ingredient).selectinload(
                IngredientModel.store
            )
        )
    )
    result = await db.execute(query)
    return result.scalar_one()


@router.get("/instances/{instance_id}", response_model=IngredientInstanceResponse)
async def get_ingredient_instance(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
) -> IngredientInstanceResponse:
    """Get a specific ingredient instance."""
    query = (
        select(IngredientInstanceModel)
        .where(IngredientInstanceModel.id == instance_id)
        .options(selectinload(IngredientInstanceModel.ingredient))
    )
    result = await db.execute(query)
    instance = result.scalar_one_or_none()

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient instance with id {instance_id} not found",
        )
    return instance


@router.put("/instances/{instance_id}", response_model=IngredientInstanceResponse)
async def update_ingredient_instance(
    instance_id: int,
    instance_update: IngredientInstanceUpdate,
    db: AsyncSession = Depends(get_db),
) -> IngredientInstanceResponse:
    """Update an ingredient instance."""
    query = (
        select(IngredientInstanceModel)
        .where(IngredientInstanceModel.id == instance_id)
        .options(selectinload(IngredientInstanceModel.ingredient))
    )
    result = await db.execute(query)
    instance = result.scalar_one_or_none()

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient instance with id {instance_id} not found",
        )

    update_data = instance_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(instance, field, value)

    await db.flush()
    await db.refresh(instance)
    return instance


@router.delete("/instances/{instance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient_instance(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an ingredient instance."""
    query = select(IngredientInstanceModel).where(
        IngredientInstanceModel.id == instance_id
    )
    result = await db.execute(query)
    instance = result.scalar_one_or_none()

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient instance with id {instance_id} not found",
        )

    await db.delete(instance)
    await db.flush()


# =============================================================================
# Parsing Endpoint
# =============================================================================

@router.post("/parse", response_model=ParseIngredientsResponse)
async def parse_ingredients(
    request: ParseIngredientsRequest,
    db: AsyncSession = Depends(get_db),
) -> ParseIngredientsResponse:
    """
    Parse natural language ingredient list into structured format.

    Uses AI to extract ingredients and matches them against existing
    ingredients in the database when possible.
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        # Fetch existing ingredients for matching
        logger.info("Fetching existing ingredients...")
        query = select(IngredientModel).order_by(IngredientModel.name)
        result = await db.execute(query)
        existing = result.scalars().all()

        existing_list = [
            {"id": ing.id, "name": ing.name, "unit": ing.unit}
            for ing in existing
        ]
        logger.info(f"Found {len(existing_list)} existing ingredients")

        # Parse with AI
        logger.info(f"Parsing text: {request.text[:100]}...")
        parser = IngredientParserService()
        parsed = parser.parse(request.text, existing_list)
        logger.info(f"Parsed {len(parsed)} ingredients")

        # Convert to response format
        ingredients = [
            ParsedIngredientItem(
                name=ing.name,
                quantity=ing.quantity,
                unit=ing.unit,
                notes=ing.notes,
                existing_ingredient_id=ing.matched_ingredient_id,
                is_new=ing.matched_ingredient_id is None,
                converted_quantity=ing.converted_quantity,
                converted_unit=ing.converted_unit,
            )
            for ing in parsed
        ]

        return ParseIngredientsResponse(
            ingredients=ingredients,
            count=len(ingredients),
        )
    except Exception as e:
        logger.exception(f"Failed to parse ingredients: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse ingredients: {str(e)}",
        ) from e
