"""Ingredient parsing service using LLM."""

from typing import Optional

from openai import OpenAI
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.unit_normalizer import unit_normalizer
from app.services.unit_converter import UnitConverter


class LLMParsedIngredient(BaseModel):
    """Schema for a single ingredient from LLM parsing."""

    name: str = Field(..., description="The normalized ingredient name")
    quantity: Optional[float] = Field(None, description="Numeric quantity")
    unit: str = Field("each", description="Unit of measurement as entered by user")
    notes: str = Field("", description="Additional notes")
    matched_ingredient_id: Optional[int] = Field(
        None, description="ID of matched existing ingredient, or null if new"
    )
    # These are set after conversion when matching existing ingredients
    converted_quantity: Optional[float] = Field(
        None, description="Quantity converted to parent ingredient's unit"
    )
    converted_unit: Optional[str] = Field(
        None, description="Parent ingredient's unit (if converted)"
    )


class LLMParsedIngredientList(BaseModel):
    """Schema for LLM response."""

    ingredients: list[LLMParsedIngredient]


class IngredientParserService:
    """Service for parsing natural language ingredients using LLM."""

    def __init__(self):
        self.client = OpenAI(
            
            api_key=settings.openai_api_key,
        )

    def _build_system_prompt(
        self, existing_ingredients: Optional[list[dict]] = None
    ) -> str:
        """Build the system prompt, optionally including existing ingredients."""
        base_prompt = """You are an expert at parsing cooking ingredient lists.
Extract ingredients from the user's input and structure them properly.

For each ingredient, determine:
- name: The NORMALIZED name of the ingredient (see rules below)
- quantity: The numeric quantity (null if not specified)
- unit: The unit of measurement. Use these canonical forms: teaspoon, tablespoon, cup, pint, quart, gallon, milliliter, liter, ounce, pound, gram, kilogram, each, head, bunch, clove, sprig, stalk, pinch, dash, can, package, slice, stick
- notes: Any additional notes (preparation, size descriptors, freshness, etc.)
- matched_ingredient_id: ID of existing ingredient if matched (see list below), or null if new

INGREDIENT NAME NORMALIZATION RULES:
1. Remove size adjectives and put them in notes: "large shallot" -> name: "shallot", notes: "large"
2. Remove freshness descriptors: "fresh rosemary" -> name: "rosemary", notes: "fresh"
3. Keep the core ingredient name simple: "shallots" and "large shallot" should both be "shallot"
4. Move preparation to notes: "garlic cloves, minced" -> name: "garlic", notes: "minced"
5. For herbs, normalize to base name: "fresh thyme leaves" -> "thyme" with specifics in notes
6. Use singular form: "tomatoes" -> "tomato"

MATCHING EXISTING INGREDIENTS:
When you find an ingredient that matches one from the existing list, set \
matched_ingredient_id to that ingredient's ID. Only match if the normalized name \
is essentially the same ingredient."""

        if existing_ingredients:
            ingredient_list = "\n".join(
                f"- ID {ing['id']}: {ing['name']} (unit: {ing['unit']})"
                for ing in existing_ingredients
            )
            base_prompt += f"""

EXISTING INGREDIENTS IN DATABASE:
{ingredient_list}

Match to existing ingredients when the normalized name refers to the same ingredient."""

        return base_prompt

    def parse(
        self,
        natural_language_input: str,
        existing_ingredients: Optional[list[dict]] = None,
    ) -> list[LLMParsedIngredient]:
        """
        Parse natural language ingredient list into structured format.

        When matching to an existing ingredient, converts the user's quantity
        to the parent ingredient's unit of measurement.

        Args:
            natural_language_input: The raw ingredient text to parse
            existing_ingredients: List of existing ingredients with id, name, unit

        Returns:
            List of parsed ingredients with matching info and converted quantities
        """
        system_prompt = self._build_system_prompt(existing_ingredients)

        completion = self.client.beta.chat.completions.parse(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": natural_language_input},
            ],
            response_format=LLMParsedIngredientList,
        )

        parsed = completion.choices[0].message.parsed

        # Build lookup for existing ingredients by ID
        existing_by_id = {}
        if existing_ingredients:
            existing_by_id = {ing["id"]: ing for ing in existing_ingredients}

        # Initialize unit converter
        converter = UnitConverter()

        # Normalize units and convert quantities for matched ingredients
        normalized = []
        for ing in parsed.ingredients:
            user_unit = unit_normalizer.normalize(ing.unit)
            user_quantity = ing.quantity
            converted_quantity = None
            converted_unit = None

            # If matched to existing ingredient, convert to its unit
            if ing.matched_ingredient_id and ing.matched_ingredient_id in existing_by_id:
                parent = existing_by_id[ing.matched_ingredient_id]
                parent_unit = parent["unit"]

                # Only convert if units are different
                if user_unit != parent_unit and user_quantity is not None:
                    result = converter.convert_quantity(
                        user_quantity,
                        user_unit,
                        parent_unit,
                        ing.name,  # Pass ingredient name for density-based conversion
                    )
                    if result is not None:
                        converted_quantity = result
                        converted_unit = parent_unit

            normalized.append(
                LLMParsedIngredient(
                    name=ing.name.lower().strip(),
                    quantity=user_quantity,
                    unit=user_unit,
                    notes=ing.notes,
                    matched_ingredient_id=ing.matched_ingredient_id,
                    converted_quantity=converted_quantity,
                    converted_unit=converted_unit,
                )
            )

        return normalized
