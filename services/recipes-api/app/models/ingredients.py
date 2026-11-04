"""Pydantic models for ingredient parsing."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# =============================================================================
# Database Model Schemas (for Ingredient and IngredientInstance tables)
# =============================================================================

class IngredientBase(BaseModel):
    """Base schema for Ingredient."""

    name: str = Field(..., description="The normalized name of the ingredient")
    store_id: Optional[int] = Field(None, description="ID of the store for this ingredient")
    unit: str = Field("each", description="Standard unit of measurement")
    is_purchased: bool = Field(False, description="Whether this ingredient has been purchased")


class IngredientCreate(IngredientBase):
    """Schema for creating an Ingredient."""

    pass


class IngredientUpdate(BaseModel):
    """Schema for updating an Ingredient."""

    name: Optional[str] = None
    store_id: Optional[int] = None
    unit: Optional[str] = None
    is_purchased: Optional[bool] = None


class StoreInfo(BaseModel):
    """Minimal store info for embedding in responses."""

    id: int
    name: str

    class Config:
        from_attributes = True


class IngredientResponse(BaseModel):
    """Schema for Ingredient responses."""

    id: int
    name: str
    store_id: Optional[int] = None
    store: Optional[StoreInfo] = None
    unit: str
    is_purchased: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IngredientInstanceBase(BaseModel):
    """Base schema for IngredientInstance."""

    ingredient_id: int
    dish_id: int
    quantity: float = Field(1.0, description="Amount of the ingredient")
    notes: Optional[str] = Field(None, description="Additional notes")


class IngredientInstanceCreate(IngredientInstanceBase):
    """Schema for creating an IngredientInstance."""

    pass


class IngredientInstanceUpdate(BaseModel):
    """Schema for updating an IngredientInstance."""

    quantity: Optional[float] = None
    notes: Optional[str] = None


class IngredientInstanceResponse(IngredientInstanceBase):
    """Schema for IngredientInstance responses."""

    id: int
    created_at: datetime
    ingredient: IngredientResponse

    class Config:
        from_attributes = True


# =============================================================================
# AI Parsing Schemas
# =============================================================================

class ParsedIngredientItem(BaseModel):
    """Schema for a single ingredient from LLM parsing."""

    name: str = Field(..., description="The normalized name of the ingredient")
    quantity: Optional[float] = Field(None, description="Numeric quantity as entered")
    unit: str = Field("each", description="Unit of measurement as entered")
    notes: str = Field("", description="Additional notes about the ingredient")
    existing_ingredient_id: Optional[int] = Field(
        None, description="ID of existing ingredient if matched"
    )
    is_new: bool = Field(True, description="Whether this is a new ingredient")
    # Unit conversion fields (populated when matched to existing ingredient)
    converted_quantity: Optional[float] = Field(
        None, description="Quantity converted to parent ingredient's unit"
    )
    converted_unit: Optional[str] = Field(
        None, description="Parent ingredient's unit (after conversion)"
    )


class ParsedIngredientList(BaseModel):
    """Schema for LLM response with parsed ingredients."""

    ingredients: list[ParsedIngredientItem]


class ParseIngredientsRequest(BaseModel):
    """Request schema for parsing natural language ingredients."""

    text: str = Field(
        ...,
        description="Natural language ingredient list to parse",
        examples=["2 lbs tomatoes, 1 head garlic, salt and pepper to taste"],
    )


class ParseIngredientsResponse(BaseModel):
    """Response schema for parsed ingredients."""

    ingredients: list[ParsedIngredientItem]
    count: int = Field(..., description="Number of parsed ingredients")


# =============================================================================
# Dish Ingredient Association (for creating dishes with ingredients)
# =============================================================================

class DishIngredientInput(BaseModel):
    """Input schema for associating an ingredient with a dish."""

    # Either provide existing_ingredient_id OR new_ingredient details
    existing_ingredient_id: Optional[int] = Field(
        None, description="ID of existing ingredient to use"
    )
    # New ingredient details (used if existing_ingredient_id is None)
    name: Optional[str] = Field(None, description="Name for new ingredient")
    store_id: Optional[int] = Field(None, description="Store ID for new ingredient")
    unit: Optional[str] = Field("each", description="Unit for new ingredient")
    # Instance details
    quantity: float = Field(1.0, description="Amount needed for this dish")
    notes: Optional[str] = Field(None, description="Notes for this dish's usage")
