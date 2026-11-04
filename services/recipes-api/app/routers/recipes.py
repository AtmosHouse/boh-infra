"""API routes for recipe processing."""

from fastapi import APIRouter

from app.models.ingredients import ParsedIngredientItem
from app.models.recipes import (
    DishIngredients,
    ProcessRecipesRequest,
    ProcessRecipesResponse,
)
from app.services.ingredient_parser import IngredientParserService

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/process", response_model=ProcessRecipesResponse)
async def process_recipes(request: ProcessRecipesRequest) -> ProcessRecipesResponse:
    """
    Process multiple recipes and extract ingredients from each.

    Takes a list of recipes with natural language ingredient lists and
    returns structured ingredients for each dish.
    """
    parser = IngredientParserService()
    dishes = []
    total_ingredients = 0

    for recipe in request.recipes:
        try:
            result = await parser.parse(recipe.recipe_text)

            ingredients = [
                ParsedIngredientItem(
                    name=ing.name,
                    quantity=ing.quantity,
                    unit=ing.unit,
                    notes=ing.notes,
                    existing_ingredient_id=ing.existing_ingredient_id,
                    is_new=ing.is_new,
                )
                for ing in result.ingredients
            ]

            dishes.append(
                DishIngredients(
                    dish_name=recipe.dish_name,
                    ingredients=ingredients,
                    count=len(ingredients),
                )
            )
            total_ingredients += len(ingredients)

        except Exception:
            # Log error but continue processing other recipes
            dishes.append(
                DishIngredients(
                    dish_name=recipe.dish_name,
                    ingredients=[],
                    count=0,
                )
            )

    return ProcessRecipesResponse(
        dishes=dishes,
        total_ingredients=total_ingredients,
    )


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for the recipes service."""
    return {"status": "healthy", "service": "recipes"}
