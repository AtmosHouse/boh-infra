"""API endpoints for dish management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.db.models import Dish as DishModel
from app.db.models import Ingredient as IngredientModel
from app.db.models import IngredientInstance as IngredientInstanceModel
from app.db.models import CourseType as DBCourseType
from app.models.dishes import (
    CourseType,
    DishCreate,
    DishListResponse,
    DishResponse,
    DishUpdate,
)
from app.services.unit_normalizer import unit_normalizer

router = APIRouter(prefix="/dishes", tags=["dishes"])


def pydantic_course_to_db(course: CourseType) -> DBCourseType:
    """Convert Pydantic CourseType to DB CourseType."""
    return DBCourseType(course.value)


@router.post("/", response_model=DishResponse, status_code=status.HTTP_201_CREATED)
async def create_dish(
    dish: DishCreate,
    db: AsyncSession = Depends(get_db),
) -> DishResponse:
    """Create a new dish with optional ingredients."""
    # Create the dish
    db_dish = DishModel(
        name=dish.name,
        course=pydantic_course_to_db(dish.course),
        description=dish.description,
        servings=dish.servings,
        recipe_url=dish.recipe_url,
    )
    db.add(db_dish)
    await db.flush()

    # Add ingredients
    for ing_input in dish.ingredients:
        if ing_input.existing_ingredient_id:
            # Use existing ingredient
            ingredient_id = ing_input.existing_ingredient_id
        else:
            # Create new ingredient
            if not ing_input.name:
                continue  # Skip if no name provided

            # Check if ingredient already exists by name
            query = select(IngredientModel).where(
                IngredientModel.name == ing_input.name.lower().strip()
            )
            result = await db.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                ingredient_id = existing.id
            else:
                new_ingredient = IngredientModel(
                    name=ing_input.name.lower().strip(),
                    store_id=ing_input.store_id,
                    unit=unit_normalizer.normalize(ing_input.unit),
                )
                db.add(new_ingredient)
                await db.flush()
                ingredient_id = new_ingredient.id

        # Create instance
        instance = IngredientInstanceModel(
            ingredient_id=ingredient_id,
            dish_id=db_dish.id,
            quantity=ing_input.quantity,
            notes=ing_input.notes,
        )
        db.add(instance)

    await db.flush()

    # Reload with relationships
    query = (
        select(DishModel)
        .where(DishModel.id == db_dish.id)
        .options(
            selectinload(DishModel.ingredient_instances).selectinload(
                IngredientInstanceModel.ingredient
            ).selectinload(IngredientModel.store)
        )
    )
    result = await db.execute(query)
    db_dish = result.scalar_one()

    return db_dish


@router.get("/", response_model=DishListResponse)
async def list_dishes(
    skip: int = 0,
    limit: int = 100,
    course: CourseType | None = None,
    db: AsyncSession = Depends(get_db),
) -> DishListResponse:
    """List all dishes with optional filtering by course."""
    query = select(DishModel).options(
        selectinload(DishModel.ingredient_instances).selectinload(
            IngredientInstanceModel.ingredient
        ).selectinload(IngredientModel.store)
    )

    if course:
        query = query.where(DishModel.course == pydantic_course_to_db(course))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    dishes = result.scalars().all()

    # Get total count
    count_query = select(DishModel)
    if course:
        count_query = count_query.where(
            DishModel.course == pydantic_course_to_db(course)
        )
    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())

    return DishListResponse(dishes=list(dishes), total=total)


@router.get("/{dish_id}", response_model=DishResponse)
async def get_dish(
    dish_id: int,
    db: AsyncSession = Depends(get_db),
) -> DishResponse:
    """Get a specific dish by ID."""
    query = (
        select(DishModel)
        .options(
            selectinload(DishModel.ingredient_instances).selectinload(
                IngredientInstanceModel.ingredient
            ).selectinload(IngredientModel.store)
        )
        .where(DishModel.id == dish_id)
    )
    result = await db.execute(query)
    dish = result.scalar_one_or_none()

    if not dish:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dish with id {dish_id} not found",
        )

    return dish


@router.put("/{dish_id}", response_model=DishResponse)
async def update_dish(
    dish_id: int,
    dish_update: DishUpdate,
    db: AsyncSession = Depends(get_db),
) -> DishResponse:
    """Update an existing dish."""
    query = (
        select(DishModel)
        .where(DishModel.id == dish_id)
        .options(
            selectinload(DishModel.ingredient_instances).selectinload(
                IngredientInstanceModel.ingredient
            ).selectinload(IngredientModel.store)
        )
    )
    result = await db.execute(query)
    dish = result.scalar_one_or_none()

    if not dish:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dish with id {dish_id} not found",
        )

    # Update only provided fields
    if dish_update.name is not None:
        dish.name = dish_update.name
    if dish_update.course is not None:
        dish.course = pydantic_course_to_db(dish_update.course)
    if dish_update.description is not None:
        dish.description = dish_update.description
    if dish_update.servings is not None:
        dish.servings = dish_update.servings

    await db.flush()
    # Re-fetch with relationships loaded
    query = (
        select(DishModel)
        .where(DishModel.id == dish_id)
        .options(
            selectinload(DishModel.ingredient_instances).selectinload(
                IngredientInstanceModel.ingredient
            ).selectinload(IngredientModel.store)
        )
    )
    result = await db.execute(query)
    dish = result.scalar_one()

    return dish


@router.delete("/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dish(
    dish_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a dish."""
    query = select(DishModel).where(DishModel.id == dish_id)
    result = await db.execute(query)
    dish = result.scalar_one_or_none()

    if not dish:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dish with id {dish_id} not found",
        )

    await db.delete(dish)
    await db.flush()
