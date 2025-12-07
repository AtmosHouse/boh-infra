"""Pydantic models for recipe processing."""

from pydantic import BaseModel, Field

from app.models.ingredients import ParsedIngredientItem


class RecipeInput(BaseModel):
    """Schema for a single recipe input."""

    dish_name: str = Field(..., description="Name of the dish")
    recipe_text: str = Field(..., description="Natural language recipe ingredient list")


class RecipeConfig(BaseModel):
    """Schema for recipe configuration."""

    dishes: dict[str, str] = Field(
        ...,
        description="Mapping of dish names to recipe file names",
        examples=[
            {"Mushroom Wellington": "wellington.txt", "Caesar Salad": "salad.txt"}
        ],
    )


class ProcessRecipesRequest(BaseModel):
    """Request schema for processing multiple recipes."""

    recipes: list[RecipeInput] = Field(
        ...,
        description="List of recipes to process",
    )


class DishIngredients(BaseModel):
    """Schema for ingredients of a single dish."""

    dish_name: str
    ingredients: list[ParsedIngredientItem]
    count: int


class ProcessRecipesResponse(BaseModel):
    """Response schema for processed recipes."""

    dishes: list[DishIngredients]
    total_ingredients: int
