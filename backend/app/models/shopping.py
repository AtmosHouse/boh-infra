"""Pydantic models for shopping list generation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.dishes import DishSummary


class DataDefaults(BaseModel):
    """Configuration for default values when data is missing."""

    quantity: float = Field(1.0, description="Default quantity when missing")
    price: float = Field(0.0, description="Default price when missing")
    location: str = Field("Unknown", description="Default location when missing")
    units: str = Field("each", description="Default units when missing")
    ingredient: str = Field("Unknown Item", description="Default ingredient name when missing")


class ShoppingItem(BaseModel):
    """Schema for a single shopping list item input."""

    ingredient: str
    quantity: float
    units: str
    location: str = ""
    price: float = 0.0
    done: bool = False
    notes: str = ""
    dish_id: Optional[int] = Field(None, description="ID of the dish this item belongs to")


class ShoppingListRequest(BaseModel):
    """Request schema for generating a shopping list."""

    items: list[ShoppingItem] = Field(
        ...,
        description="List of ingredient items to consolidate into a shopping list",
    )
    defaults: Optional[DataDefaults] = Field(
        None,
        description="Default values for missing data",
    )
    enable_unit_conversion: bool = Field(
        True,
        description="Whether to enable automatic unit conversion",
    )


class ConsolidatedItem(BaseModel):
    """Schema for a consolidated shopping list item."""

    location: str
    ingredient: str
    quantity: float
    units: str
    price: float


class ValidationWarning(BaseModel):
    """Schema for a data validation warning."""

    row: int
    message: str


class ShoppingListResponse(BaseModel):
    """Response schema for generated shopping list."""

    items: list[ConsolidatedItem]
    total_items: int
    warnings: list[ValidationWarning] = []
    conversions_applied: list[str] = []


# Database-backed shopping list item schemas
class ShoppingListItemCreate(BaseModel):
    """Schema for creating a shopping list item."""

    ingredient_name: str = Field(..., min_length=1, max_length=255)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    dish_id: Optional[int] = Field(None, description="ID of the associated dish")


class ShoppingListItemUpdate(BaseModel):
    """Schema for updating a shopping list item."""

    ingredient_name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    is_checked: Optional[bool] = None
    dish_id: Optional[int] = None


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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShoppingListItemsResponse(BaseModel):
    """Schema for listing shopping list items."""

    items: list[ShoppingListItemResponse]
    total: int
    checked_count: int
