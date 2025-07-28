#!/usr/bin/env python3
import csv
import argparse
from collections import defaultdict
from typing import Dict, Any, List

class DataDefaults:
    """Configuration class for default values when data is missing."""
    def __init__(self):
        self.quantity = 1.0
        self.price = 0.0
        self.location = "Unknown"
        self.units = "each"
        self.ingredient = "Unknown Item"

class DataValidator:
    """Handles data validation and provides warnings for missing/invalid data."""
    def __init__(self, defaults: DataDefaults):
        self.defaults = defaults
        self.warnings: List[str] = []
        self.row_count = 0
        self.skipped_rows = 0

    def validate_row(self, row: Dict[str, str], row_num: int) -> Dict[str, Any]:
        """Validate and clean a single row of data."""
        self.row_count += 1
        cleaned_row = {}
        has_critical_missing = False

        # Validate ingredient (critical field)
        ingredient = row.get("Ingredient", "").strip()
        if not ingredient:
            self.warnings.append(f"Row {row_num}: Missing ingredient name")
            ingredient = self.defaults.ingredient
            has_critical_missing = True
        cleaned_row["ingredient"] = ingredient

        # Validate location
        location = row.get("Location", "").strip()
        if not location:
            self.warnings.append(f"Row {row_num}: Missing location, using '{self.defaults.location}'")
            location = self.defaults.location
        cleaned_row["location"] = location

        # Validate quantity
        qty_str = row.get("Qty", "").strip()
        try:
            quantity = float(qty_str) if qty_str else self.defaults.quantity
            if quantity < 0:
                self.warnings.append(f"Row {row_num}: Negative quantity ({quantity}), using default")
                quantity = self.defaults.quantity
        except ValueError:
            self.warnings.append(f"Row {row_num}: Invalid quantity '{qty_str}', using default ({self.defaults.quantity})")
            quantity = self.defaults.quantity
        cleaned_row["quantity"] = quantity

        # Validate units
        units = row.get("Units", "").strip()
        if not units:
            self.warnings.append(f"Row {row_num}: Missing units, using '{self.defaults.units}'")
            units = self.defaults.units
        cleaned_row["units"] = units

        # Validate price
        price_str = row.get("Price", "").strip()
        try:
            price = float(price_str) if price_str else self.defaults.price
            if price < 0:
                self.warnings.append(f"Row {row_num}: Negative price ({price}), using default")
                price = self.defaults.price
        except ValueError:
            self.warnings.append(f"Row {row_num}: Invalid price '{price_str}', using default ({self.defaults.price})")
            price = self.defaults.price
        cleaned_row["price"] = price

        # Check "Done?" field
        done = row.get("Done?", "").strip().lower()
        cleaned_row["done"] = done in ("1", "true", "yes")

        # Skip rows with critical missing data if ingredient is still unknown
        if has_critical_missing and ingredient == self.defaults.ingredient:
            self.warnings.append(f"Row {row_num}: Skipping row due to missing critical data")
            self.skipped_rows += 1
            return None

        return cleaned_row

    def print_summary(self):
        """Print a summary of data validation results."""
        print(f"\nData Validation Summary:")
        print(f"  Total rows processed: {self.row_count}")
        print(f"  Rows skipped: {self.skipped_rows}")
        print(f"  Warnings generated: {len(self.warnings)}")

        if self.warnings:
            print(f"\nWarnings:")
            for warning in self.warnings:
                print(f"  ⚠️  {warning}")

def generate_shopping_list(input_path: str, output_path: str, defaults: DataDefaults = None):
    """Generate a consolidated shopping list from ingredient CSV with robust data validation."""
    if defaults is None:
        defaults = DataDefaults()

    validator = DataValidator(defaults)
    # Use a dict keyed by (location, ingredient, units) to accumulate totals
    totals = defaultdict(lambda: {"quantity": 0.0, "price": 0.0})

    with open(input_path, newline='') as infile:
        reader = csv.DictReader(infile)
        for row_num, row in enumerate(reader, start=2):  # Start at 2 since row 1 is headers
            # Validate and clean the row data
            cleaned_row = validator.validate_row(row, row_num)

            # Skip invalid rows
            if cleaned_row is None:
                continue

            # Skip items already bought
            if cleaned_row["done"]:
                continue

            # Aggregate the data
            key = (cleaned_row["location"], cleaned_row["ingredient"], cleaned_row["units"])
            totals[key]["quantity"] += cleaned_row["quantity"]
            totals[key]["price"] += cleaned_row["price"]

    # Print validation summary
    validator.print_summary()

    # write out the aggregated shopping list
    with open(output_path, "w", newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerow(["Location", "Ingredient", "Qty", "Units", "Price"])
        for (loc, ing, unit), vals in sorted(totals.items()):
            writer.writerow([loc, ing, vals["quantity"], unit, vals["price"]])

    print(f"\nShopping list written to: {output_path}")
    print(f"Total unique items: {len(totals)}")

def main():
    parser = argparse.ArgumentParser(
        description="Generate a shopping list CSV from a master ingredients CSV with robust data validation."
    )
    parser.add_argument(
        "input_csv",
        help="Path to master CSV with columns: Ingredient,Qty,Units,Location,Done?,Price"
    )
    parser.add_argument(
        "output_csv",
        help="Path where the aggregated shopping list CSV should be written"
    )

    # Default value configuration
    parser.add_argument(
        "--default-quantity", type=float, default=1.0,
        help="Default quantity when missing or invalid (default: 1.0)"
    )
    parser.add_argument(
        "--default-price", type=float, default=0.0,
        help="Default price when missing or invalid (default: 0.0)"
    )
    parser.add_argument(
        "--default-location", default="Unknown",
        help="Default location when missing (default: 'Unknown')"
    )
    parser.add_argument(
        "--default-units", default="each",
        help="Default units when missing (default: 'each')"
    )
    parser.add_argument(
        "--default-ingredient", default="Unknown Item",
        help="Default ingredient name when missing (default: 'Unknown Item')"
    )

    args = parser.parse_args()

    # Create custom defaults from command line arguments
    defaults = DataDefaults()
    defaults.quantity = args.default_quantity
    defaults.price = args.default_price
    defaults.location = args.default_location
    defaults.units = args.default_units
    defaults.ingredient = args.default_ingredient

    generate_shopping_list(args.input_csv, args.output_csv, defaults)

if __name__ == "__main__":
    main()

