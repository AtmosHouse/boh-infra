"""Pydantic models for dish management."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from app.models.ingredients import DishIngredientInput


class CourseType(str, Enum):
    """Enum for meal course types."""

    APPETIZER = "appetizer"
    SOUP = "soup"
    SALAD = "salad"
    MAIN = "main"
    SIDE = "side"
    DESSERT = "dessert"
    BEVERAGE = "beverage"
    OTHER = "other"


class DishBase(BaseModel):
    """Base schema for dish data."""

    name: str = Field(
        ..., min_length=1, max_length=255, description="Name of the dish"
    )
    course: CourseType = Field(
        CourseType.MAIN, description="Course type for the dish"
    )
    description: Optional[str] = Field(
        None, description="Optional description of the dish"
    )
    servings: Optional[int] = Field(None, ge=1, description="Number of servings")
    recipe_url: Optional[str] = Field(
        None, max_length=500, description="URL to the recipe"
    )


class DishCreate(DishBase):
    """Schema for creating a new dish with optional ingredients."""

    ingredients: list[DishIngredientInput] = Field(
        default_factory=list,
        description="List of ingredients to add to the dish",
    )


class DishUpdate(BaseModel):
    """Schema for updating an existing dish."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    course: Optional[CourseType] = None
    description: Optional[str] = None
    servings: Optional[int] = Field(None, ge=1)
    recipe_url: Optional[str] = Field(None, max_length=500)


class StoreInfo(BaseModel):
    """Minimal store info for embedding in responses."""

    id: int
    name: str

    class Config:
        from_attributes = True


class IngredientInfo(BaseModel):
    """Schema for ingredient info nested in dish response."""

    id: int
    name: str
    store_id: Optional[int] = None
    store: Optional[StoreInfo] = None
    unit: str
    is_purchased: bool = False

    class Config:
        from_attributes = True


class DishIngredientResponse(BaseModel):
    """Schema for an ingredient instance in a dish response."""

    id: int  # instance id
    ingredient_id: int
    quantity: float
    notes: Optional[str]
    ingredient: IngredientInfo

    class Config:
        from_attributes = True


class DishResponse(DishBase):
    """Schema for dish response with ID and timestamps."""

    id: int
    created_at: datetime
    updated_at: datetime
    ingredients: list[DishIngredientResponse] = Field(
        default_factory=list, alias="ingredient_instances"
    )

    class Config:
        from_attributes = True
        populate_by_name = True


class DishListResponse(BaseModel):
    """Schema for listing dishes."""

    dishes: list[DishResponse]
    total: int


class DishSummary(BaseModel):
    """Minimal dish info for references."""

    id: int
    name: str
    course: CourseType

    class Config:
        from_attributes = True
