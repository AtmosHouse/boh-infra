#!/usr/bin/env python3
"""
Convert natural language ingredient lists into structured CSV format using OpenAI API.

Usage:
    python make_ingredient_list.py "2 lbs tomatoes, 1 head garlic" -d "Pasta" output.csv
    echo "ingredient list" | python make_ingredient_list.py - -d "Soup" output.csv
    python make_ingredient_list.py input.txt -d "Wellington" output.csv
"""

import argparse
import csv
import sys
from collections import defaultdict
from typing import List, Optional

from openai import OpenAI
from pydantic import BaseModel


class Ingredient(BaseModel):
    """Schema for a single ingredient."""
    ingredient: str
    qty: Optional[float] = None
    units: Optional[str] = None
    notes: str = ""


class IngredientList(BaseModel):
    """Schema for a list of ingredients."""
    ingredients: List[Ingredient]


def parse_ingredients_with_llm(natural_language_input: str) -> IngredientList:
    """
    Parse natural language ingredient list into structured format using OpenAI API.
    
    Args:
        natural_language_input: Natural language description of ingredients
        
    Returns:
        IngredientList containing parsed ingredients
    """
    client = OpenAI(base_url="http://localhost:8000/v1", api_key="sk-placeholder")
    
    system_prompt = """You are an expert at parsing cooking ingredient lists.
Extract ingredients from the user's input and structure them properly.

For each ingredient, determine:
- ingredient: The NORMALIZED name of the ingredient (see rules below)
- qty: The numeric quantity (null if not specified, e.g., "salt and pepper" has no quantity)
- units: The unit of measurement (null if not specified). Examples: "lbs", "oz", "cups", "each", "head", "clove", "bunch", "tablespoon", "teaspoon"
- notes: Any additional notes about the ingredient (preparation instructions, brand preferences, substitutions, size descriptors, etc.)

INGREDIENT NAME NORMALIZATION RULES:
1. Remove size adjectives and put them in notes: "large shallot" -> ingredient: "shallot", notes: "large"
2. Remove freshness descriptors: "fresh rosemary" -> ingredient: "rosemary", notes: "fresh"
3. Keep the core ingredient name simple and consistent: "shallots" and "large shallot" should both be "shallot"
4. Move preparation to notes: "garlic cloves, minced" -> ingredient: "garlic", notes: "minced"
5. For herbs, normalize to base name: "fresh thyme leaves", "fresh thyme sprigs", "thyme" -> all become "thyme" with specifics in notes

Be smart about parsing:
- "2 lbs tomatoes" -> qty: 2, units: "lbs", ingredient: "tomatoes"
- "a head of garlic" -> qty: 1, units: "head", ingredient: "garlic"
- "3 cloves garlic, minced" -> qty: 3, units: "clove", ingredient: "garlic", notes: "minced"
- "salt to taste" -> qty: null, units: null, ingredient: "salt", notes: "to taste"
- "Kosher salt and black pepper" -> TWO ingredients: "kosher salt" (qty: null) and "black pepper" (qty: null)
- "1/2 cup olive oil" -> qty: 0.5, units: "cup", ingredient: "olive oil"
- "1 large shallot, minced" -> qty: 1, units: "each", ingredient: "shallot", notes: "large, minced"
- "2 tablespoons fresh rosemary" -> qty: 2, units: "tablespoon", ingredient: "rosemary", notes: "fresh"

IMPORTANT: If a quantity/unit is truly not specified (like "salt and pepper" or "to taste"), leave qty and units as null. Do NOT default to 1 or "each".
"""

    completion = client.beta.chat.completions.parse(
        model="Qwen/Qwen3-235B-A22B-Instruct-2507-FP8",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": natural_language_input}
        ],
        response_format=IngredientList,
    )
    
    return completion.choices[0].message.parsed


def deduplicate_ingredients(ingredients: IngredientList) -> List[Ingredient]:
    """
    Deduplicate ingredients by combining entries with the same ingredient name.

    Args:
        ingredients: Parsed ingredient list

    Returns:
        List of deduplicated ingredients
    """
    # Group by normalized ingredient name
    grouped = defaultdict(list)
    for ing in ingredients.ingredients:
        key = ing.ingredient.lower().strip()
        grouped[key].append(ing)

    deduplicated = []
    for key, items in grouped.items():
        if len(items) == 1:
            deduplicated.append(items[0])
        else:
            # Combine multiple entries
            # Use the first item's ingredient name (preserve original casing)
            combined = Ingredient(
                ingredient=items[0].ingredient,
                qty=None,
                units=None,
                notes=""
            )

            # Collect all quantities and notes
            qty_parts = []
            notes_parts = []

            for item in items:
                if item.qty is not None and item.units is not None:
                    qty_parts.append(f"{item.qty} {item.units}")
                elif item.qty is not None:
                    qty_parts.append(str(item.qty))
                if item.notes:
                    notes_parts.append(item.notes)

            # If all items have compatible units, try to sum
            units_set = {item.units for item in items if item.units is not None}
            if len(units_set) == 1 and all(item.qty is not None for item in items):
                combined.qty = sum(item.qty for item in items)
                combined.units = units_set.pop()
            elif qty_parts:
                # Different units or missing quantities - put in notes
                combined.notes = " + ".join(qty_parts)

            # Append any additional notes
            if notes_parts:
                if combined.notes:
                    combined.notes += "; " + "; ".join(notes_parts)
                else:
                    combined.notes = "; ".join(notes_parts)

            deduplicated.append(combined)

    return deduplicated


def write_ingredients_csv(ingredients: List[Ingredient], dish_name: str, output_path: str):
    """
    Write parsed ingredients to CSV file.

    Args:
        ingredients: List of ingredients
        dish_name: Name of the dish
        output_path: Path to output CSV file
    """
    with open(output_path, "w", newline="") as outfile:
        writer = csv.writer(outfile)
        writer.writerow(["Dish", "Ingredient", "Qty", "Units", "Location", "Done?", "Price", "Notes"])

        for ing in ingredients:
            writer.writerow([
                dish_name,
                ing.ingredient,
                ing.qty if ing.qty is not None else "",
                ing.units if ing.units is not None else "",
                "",  # Location - left blank for manual entry
                "False",  # Done? - default to False
                "",  # Price - left blank for manual entry
                ing.notes
            ])


def main():
    parser = argparse.ArgumentParser(
        description="Convert natural language ingredient list to structured CSV using OpenAI API."
    )
    parser.add_argument(
        "input",
        help="Natural language ingredient list, path to text file, or '-' for stdin"
    )
    parser.add_argument(
        "-d", "--dish",
        required=True,
        help="Name of the dish these ingredients are for"
    )
    parser.add_argument(
        "output_csv",
        help="Path where the structured ingredient CSV should be written"
    )

    args = parser.parse_args()

    # Get input text
    if args.input == "-":
        input_text = sys.stdin.read().strip()
    elif args.input.endswith(".txt"):
        with open(args.input, "r") as f:
            input_text = f.read().strip()
    else:
        input_text = args.input

    if not input_text:
        print("Error: No input provided", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing ingredients for '{args.dish}'...")
    parsed = parse_ingredients_with_llm(input_text)

    print(f"Parsed {len(parsed.ingredients)} ingredients, deduplicating...")
    ingredients = deduplicate_ingredients(parsed)

    write_ingredients_csv(ingredients, args.dish, args.output_csv)

    print(f"Wrote {len(ingredients)} ingredients to {args.output_csv}")


if __name__ == "__main__":
    main()

