"""Pydantic models for the shopping list."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.dishes import DishSummary


# =============================================================================
# Consolidated shopping list view (GET /shopping/list)
# =============================================================================


class ShoppingContribution(BaseModel):
    """One contribution to a shopping list line — a dish's usage or a manual entry."""

    instance_id: Optional[int] = Field(None, description="ingredient_instances.id")
    item_id: Optional[int] = Field(None, description="shopping_list_items.id for manual entries")
    dish_id: Optional[int] = None
    dish_name: str = Field(description="Dish name, or 'Manual entry'")
    quantity: Optional[float] = None
    unit: Optional[str] = Field(None, description="Unit as entered")
    notes: Optional[str] = None


class ShoppingListLineItem(BaseModel):
    """A single consolidated line on the shopping list."""

    key: str = Field(description="Stable identity: 'ingredient:<id>' or 'item:<id>'")
    ingredient_id: Optional[int] = Field(None, description="Set when backed by an Ingredient")
    item_id: Optional[int] = Field(None, description="Set for standalone manual items")
    name: str
    quantity: Optional[float] = Field(None, description="Total in display unit")
    unit: Optional[str] = None
    store_id: Optional[int] = None
    is_done: bool = False
    has_dish_items: bool = False
    contributions: list[ShoppingContribution] = []


class ShoppingListViewResponse(BaseModel):
    """The full consolidated shopping list."""

    items: list[ShoppingListLineItem]
    total_items: int
    done_count: int
    conversions_applied: list[str] = []


# =============================================================================
# Manual shopping list items (database-backed)
# =============================================================================


class ShoppingListItemCreate(BaseModel):
    """Schema for creating a shopping list item."""

    ingredient_name: str = Field(..., min_length=1, max_length=255)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    dish_id: Optional[int] = Field(None, description="ID of the associated dish")
    store_id: Optional[int] = Field(None, description="ID of the store to buy from")


class ShoppingListItemUpdate(BaseModel):
    """Schema for updating a shopping list item."""

    ingredient_name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    is_checked: Optional[bool] = None
    dish_id: Optional[int] = None
    store_id: Optional[int] = None


class ShoppingListItemResponse(BaseModel):
    """Schema for a shopping list item response."""

    id: int
    ingredient_name: str
    quantity: Optional[float]
    unit: Optional[str]
    category: Optional[str]
    notes: Optional[str]
    is_checked: bool
    dish: Optional[DishSummary] = None
    store_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShoppingListItemsResponse(BaseModel):
    """Schema for listing shopping list items."""

    items: list[ShoppingListItemResponse]
    total: int
    checked_count: int
