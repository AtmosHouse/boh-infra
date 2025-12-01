#!/usr/bin/env python3
"""
Process multiple recipe files and generate a unified ingredient list and optional shopping list.

Usage:
    python process_recipes.py recipes_folder/ -o ingredients.csv
    python process_recipes.py recipes_folder/ -o ingredients.csv --shopping-list shopping.csv

Expected folder structure:
    recipes_folder/
        config.yaml
        recipe1.txt
        recipe2.txt
        ...

config.yaml format:
    dishes:
      "Mushroom Wellington": "wellington.txt"
      "Caesar Salad": "salad.txt"
"""

import argparse
import csv
import subprocess
import sys
from pathlib import Path

import yaml

from make_ingredient_list import (
    Ingredient,
    deduplicate_ingredients,
    parse_ingredients_with_llm,
)


def load_config(config_path: Path) -> dict:
    """Load the config.yaml file mapping dish names to recipe files."""
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    return config.get("dishes", {})


def process_recipe(recipe_path: Path, dish_name: str) -> list[Ingredient]:
    """Process a single recipe file and return deduplicated ingredients."""
    with open(recipe_path, "r") as f:
        input_text = f.read().strip()
    
    if not input_text:
        print(f"  Warning: Empty recipe file for '{dish_name}'", file=sys.stderr)
        return []
    
    parsed = parse_ingredients_with_llm(input_text)
    ingredients = deduplicate_ingredients(parsed)
    return ingredients


def write_unified_csv(
    all_ingredients: list[tuple[str, Ingredient]], 
    output_path: Path
):
    """Write all ingredients from all dishes to a unified CSV."""
    with open(output_path, "w", newline="") as outfile:
        writer = csv.writer(outfile)
        writer.writerow(["Dish", "Ingredient", "Qty", "Units", "Location", "Done?", "Price", "Notes"])
        
        for dish_name, ing in all_ingredients:
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


def run_shopping_list(input_csv: Path, output_csv: Path):
    """Run make_shopping_list.py on the unified ingredients CSV."""
    script_path = Path(__file__).parent / "make_shopping_list.py"
    
    result = subprocess.run(
        [sys.executable, str(script_path), str(input_csv), str(output_csv)],
        capture_output=True,
        text=True
    )
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    
    return result.returncode


def main():
    parser = argparse.ArgumentParser(
        description="Process multiple recipe files into a unified ingredient list."
    )
    parser.add_argument(
        "recipe_folder",
        type=Path,
        help="Folder containing config.yaml and recipe txt files"
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        required=True,
        help="Path for the unified ingredients CSV"
    )
    parser.add_argument(
        "--shopping-list",
        type=Path,
        help="If provided, also generate a consolidated shopping list CSV"
    )
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Name of config file in recipe folder (default: config.yaml)"
    )
    
    args = parser.parse_args()
    
    # Validate folder exists
    if not args.recipe_folder.is_dir():
        print(f"Error: '{args.recipe_folder}' is not a directory", file=sys.stderr)
        sys.exit(1)
    
    # Load config
    config_path = args.recipe_folder / args.config
    if not config_path.exists():
        print(f"Error: Config file not found at '{config_path}'", file=sys.stderr)
        sys.exit(1)
    
    dishes = load_config(config_path)
    if not dishes:
        print("Error: No dishes defined in config.yaml", file=sys.stderr)
        sys.exit(1)
    
    print(f"Found {len(dishes)} dishes in config")
    
    # Process each recipe
    all_ingredients: list[tuple[str, Ingredient]] = []
    
    for dish_name, recipe_file in dishes.items():
        recipe_path = args.recipe_folder / recipe_file
        
        if not recipe_path.exists():
            print(f"  Warning: Recipe file not found: '{recipe_path}'", file=sys.stderr)
            continue
        
        print(f"Processing '{dish_name}' from {recipe_file}...")
        ingredients = process_recipe(recipe_path, dish_name)
        
        for ing in ingredients:
            all_ingredients.append((dish_name, ing))
        
        print(f"  Found {len(ingredients)} ingredients")
    
    # Write unified CSV
    write_unified_csv(all_ingredients, args.output)
    print(f"\nWrote {len(all_ingredients)} total ingredients to {args.output}")
    
    # Optionally generate shopping list
    if args.shopping_list:
        print(f"\nGenerating shopping list...")
        returncode = run_shopping_list(args.output, args.shopping_list)
        if returncode != 0:
            sys.exit(returncode)


if __name__ == "__main__":
    main()

