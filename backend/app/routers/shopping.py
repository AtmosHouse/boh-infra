"""API routes for shopping list generation."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.db.models import Dish as DishModel
from app.db.models import ShoppingListItem as ShoppingListItemModel
from app.models.dishes import CourseType, DishSummary
from app.models.shopping import (
    ConsolidatedItem,
    ShoppingItem,
    ShoppingListItemCreate,
    ShoppingListItemResponse,
    ShoppingListItemsResponse,
    ShoppingListItemUpdate,
    ShoppingListRequest,
    ShoppingListResponse,
    ValidationWarning,
)
from app.services.data_validator import DataDefaults as ServiceDataDefaults
from app.services.shopping_list import ShoppingListService
from app.db.models import CourseType as DBCourseType

router = APIRouter(prefix="/shopping", tags=["shopping"])


@router.post("/generate", response_model=ShoppingListResponse)
async def generate_shopping_list(request: ShoppingListRequest) -> ShoppingListResponse:
    """
    Generate a consolidated shopping list from ingredient items.

    Takes a list of shopping items and consolidates them by location and ingredient,
    converting units where possible and summing quantities.
    """
    # Convert request defaults to service defaults
    service_defaults = None
    if request.defaults:
        service_defaults = ServiceDataDefaults(
            quantity=request.defaults.quantity,
            price=request.defaults.price,
            location=request.defaults.location,
            units=request.defaults.units,
            ingredient=request.defaults.ingredient,
        )

    service = ShoppingListService(
        defaults=service_defaults,
        enable_unit_conversion=request.enable_unit_conversion,
    )

    consolidated = service.generate(request.items)
    warnings = service.get_warnings()
    conversions = service.get_conversions()

    return ShoppingListResponse(
        items=consolidated,
        total_items=len(consolidated),
        warnings=[ValidationWarning(row=w["row"], message=w["message"]) for w in warnings],
        conversions_applied=conversions,
    )


@router.post("/consolidate", response_model=list[ConsolidatedItem])
async def consolidate_items(
    items: list[ShoppingItem],
    enable_unit_conversion: bool = True,
) -> list[ConsolidatedItem]:
    """
    Simple endpoint to consolidate shopping items without full validation response.

    Useful for quick consolidation without needing detailed warnings.
    """
    service = ShoppingListService(enable_unit_conversion=enable_unit_conversion)
    return service.generate(items)


# Database-backed shopping list endpoints
def _db_course_to_pydantic(course: DBCourseType) -> CourseType:
    """Convert DB CourseType to Pydantic CourseType."""
    return CourseType(course.value)


@router.post("/items", response_model=ShoppingListItemResponse, status_code=status.HTTP_201_CREATED)
async def create_shopping_item(
    item: ShoppingListItemCreate,
    db: AsyncSession = Depends(get_db),
) -> ShoppingListItemResponse:
    """Create a new shopping list item."""
    # Verify dish exists if provided
    dish = None
    if item.dish_id:
        query = select(DishModel).where(DishModel.id == item.dish_id)
        result = await db.execute(query)
        dish = result.scalar_one_or_none()
        if not dish:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dish with id {item.dish_id} not found",
            )

    db_item = ShoppingListItemModel(
        ingredient_name=item.ingredient_name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category,
        notes=item.notes,
        dish_id=item.dish_id,
    )
    db.add(db_item)
    await db.flush()
    await db.refresh(db_item)

    dish_summary = None
    if dish:
        dish_summary = DishSummary(
            id=dish.id,
            name=dish.name,
            course=_db_course_to_pydantic(dish.course),
        )

    return ShoppingListItemResponse(
        id=db_item.id,
        ingredient_name=db_item.ingredient_name,
        quantity=db_item.quantity,
        unit=db_item.unit,
        category=db_item.category,
        notes=db_item.notes,
        is_checked=db_item.is_checked,
        dish=dish_summary,
        created_at=db_item.created_at,
        updated_at=db_item.updated_at,
    )


@router.get("/items", response_model=ShoppingListItemsResponse)
async def list_shopping_items(
    skip: int = 0,
    limit: int = 100,
    checked: bool | None = None,
    dish_id: int | None = None,
    db: AsyncSession = Depends(get_db),
) -> ShoppingListItemsResponse:
    """List all shopping list items with optional filtering."""
    query = select(ShoppingListItemModel).options(selectinload(ShoppingListItemModel.dish))

    if checked is not None:
        query = query.where(ShoppingListItemModel.is_checked == checked)
    if dish_id is not None:
        query = query.where(ShoppingListItemModel.dish_id == dish_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    # Get counts
    count_query = select(func.count(ShoppingListItemModel.id))
    if checked is not None:
        count_query = count_query.where(ShoppingListItemModel.is_checked == checked)
    if dish_id is not None:
        count_query = count_query.where(ShoppingListItemModel.dish_id == dish_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    checked_query = select(func.count(ShoppingListItemModel.id)).where(
        ShoppingListItemModel.is_checked.is_(True)
    )
    checked_result = await db.execute(checked_query)
    checked_count = checked_result.scalar() or 0

    response_items = []
    for item in items:
        dish_summary = None
        if item.dish:
            dish_summary = DishSummary(
                id=item.dish.id,
                name=item.dish.name,
                course=_db_course_to_pydantic(item.dish.course),
            )
        response_items.append(
            ShoppingListItemResponse(
                id=item.id,
                ingredient_name=item.ingredient_name,
                quantity=item.quantity,
                unit=item.unit,
                category=item.category,
                notes=item.notes,
                is_checked=item.is_checked,
                dish=dish_summary,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
        )

    return ShoppingListItemsResponse(
        items=response_items,
        total=total,
        checked_count=checked_count,
    )


@router.get("/items/{item_id}", response_model=ShoppingListItemResponse)
async def get_shopping_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
) -> ShoppingListItemResponse:
    """Get a specific shopping list item."""
    query = (
        select(ShoppingListItemModel)
        .options(selectinload(ShoppingListItemModel.dish))
        .where(ShoppingListItemModel.id == item_id)
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shopping item with id {item_id} not found",
        )

    dish_summary = None
    if item.dish:
        dish_summary = DishSummary(
            id=item.dish.id,
            name=item.dish.name,
            course=_db_course_to_pydantic(item.dish.course),
        )

    return ShoppingListItemResponse(
        id=item.id,
        ingredient_name=item.ingredient_name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category,
        notes=item.notes,
        is_checked=item.is_checked,
        dish=dish_summary,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.put("/items/{item_id}", response_model=ShoppingListItemResponse)
async def update_shopping_item(
    item_id: int,
    item_update: ShoppingListItemUpdate,
    db: AsyncSession = Depends(get_db),
) -> ShoppingListItemResponse:
    """Update a shopping list item."""
    query = (
        select(ShoppingListItemModel)
        .options(selectinload(ShoppingListItemModel.dish))
        .where(ShoppingListItemModel.id == item_id)
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shopping item with id {item_id} not found",
        )

    # Verify new dish exists if provided
    if item_update.dish_id is not None:
        if item_update.dish_id != 0:  # 0 means remove dish association
            dish_query = select(DishModel).where(DishModel.id == item_update.dish_id)
            dish_result = await db.execute(dish_query)
            if not dish_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Dish with id {item_update.dish_id} not found",
                )
            item.dish_id = item_update.dish_id
        else:
            item.dish_id = None

    # Update fields
    if item_update.ingredient_name is not None:
        item.ingredient_name = item_update.ingredient_name
    if item_update.quantity is not None:
        item.quantity = item_update.quantity
    if item_update.unit is not None:
        item.unit = item_update.unit
    if item_update.category is not None:
        item.category = item_update.category
    if item_update.notes is not None:
        item.notes = item_update.notes
    if item_update.is_checked is not None:
        item.is_checked = item_update.is_checked

    await db.flush()
    await db.refresh(item)

    # Reload with dish relationship
    query = (
        select(ShoppingListItemModel)
        .options(selectinload(ShoppingListItemModel.dish))
        .where(ShoppingListItemModel.id == item_id)
    )
    result = await db.execute(query)
    item = result.scalar_one()

    dish_summary = None
    if item.dish:
        dish_summary = DishSummary(
            id=item.dish.id,
            name=item.dish.name,
            course=_db_course_to_pydantic(item.dish.course),
        )

    return ShoppingListItemResponse(
        id=item.id,
        ingredient_name=item.ingredient_name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category,
        notes=item.notes,
        is_checked=item.is_checked,
        dish=dish_summary,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shopping_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a shopping list item."""
    query = select(ShoppingListItemModel).where(ShoppingListItemModel.id == item_id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shopping item with id {item_id} not found",
        )

    await db.delete(item)
    await db.flush()


@router.patch("/items/{item_id}/toggle", response_model=ShoppingListItemResponse)
async def toggle_shopping_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
) -> ShoppingListItemResponse:
    """Toggle the checked status of a shopping list item."""
    query = (
        select(ShoppingListItemModel)
        .options(selectinload(ShoppingListItemModel.dish))
        .where(ShoppingListItemModel.id == item_id)
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shopping item with id {item_id} not found",
        )

    item.is_checked = not item.is_checked
    await db.flush()
    await db.refresh(item)

    dish_summary = None
    if item.dish:
        dish_summary = DishSummary(
            id=item.dish.id,
            name=item.dish.name,
            course=_db_course_to_pydantic(item.dish.course),
        )

    return ShoppingListItemResponse(
        id=item.id,
        ingredient_name=item.ingredient_name,
        quantity=item.quantity,
        unit=item.unit,
        category=item.category,
        notes=item.notes,
        is_checked=item.is_checked,
        dish=dish_summary,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )
