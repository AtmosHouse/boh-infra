#!/usr/bin/env python3
import csv
import argparse
from collections import defaultdict
from typing import Dict, Any, List, Optional, Tuple
import pint

class UnitConverter:
    """Handles unit conversions for cooking ingredients."""

    def __init__(self):
        self.ureg = pint.UnitRegistry()
        # Define common cooking unit aliases
        self.ureg.define('each = 1 * dimensionless')
        self.ureg.define('clove = 1 * dimensionless')
        self.ureg.define('head = 1 * dimensionless')
        self.ureg.define('bunch = 1 * dimensionless')
        self.ureg.define('package = 1 * dimensionless')
        self.ureg.define('container = 1 * dimensionless')
        self.ureg.define('bottle = 1 * dimensionless')
        self.ureg.define('loaf = 1 * dimensionless')
        # Define stick of butter as 4 oz (standard US measurement)
        self.ureg.define('stick = 4 * ounce')

        # Define preferred units for different categories
        self.preferred_units = {
            # Volume units - prefer cups for cooking
            'volume': ['cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'fluid_ounce', 'fluid_ounces'],
            # Weight units - prefer pounds for shopping
            'weight': ['pound', 'pounds', 'ounce', 'ounces', 'gram', 'grams', 'kilogram', 'kilograms', 'stick'],
            # Count units - keep as-is
            'count': ['each', 'clove', 'head', 'bunch', 'package', 'container', 'bottle', 'loaf']
        }

        # Common ingredient conversions (volume to weight)
        # These are approximate conversions for common cooking ingredients
        self.ingredient_conversions = {
            'sugar': {'cup': '7.05 ounce', 'density_factor': 7.05},
            'flour': {'cup': '4.25 ounce', 'density_factor': 4.25},
            'butter': {'cup': '8 ounce', 'density_factor': 8.0},
        }

        # Unit preferences for output (what to convert TO)
        self.output_preferences = {
            'volume': 'cup',
            'weight': 'pound',
            'count': 'each'  # Keep count units as-is mostly
        }

    def normalize_unit_name(self, unit_str: str) -> str:
        """Normalize unit names to standard forms."""
        unit_str = unit_str.lower().strip()

        # Handle common variations
        unit_mappings = {
            'lb': 'pound', 'lbs': 'pound', 'pounds': 'pound',
            'oz': 'ounce', 'ounces': 'ounce',
            'c': 'cup', 'cups': 'cup',
            'tbsp': 'tablespoon', 'tablespoons': 'tablespoon', 'tbs': 'tablespoon',
            'tsp': 'teaspoon', 'teaspoons': 'teaspoon', 'ts': 'teaspoon',
            'fl oz': 'fluid_ounce', 'fluid oz': 'fluid_ounce', 'fl_oz': 'fluid_ounce',
            'g': 'gram', 'grams': 'gram',
            'kg': 'kilogram', 'kilograms': 'kilogram',
        }

        return unit_mappings.get(unit_str, unit_str)

    def get_unit_category(self, unit_str: str) -> str:
        """Determine the category of a unit (volume, weight, count)."""
        normalized = self.normalize_unit_name(unit_str)

        for category, units in self.preferred_units.items():
            if normalized in units:
                return category

        return 'count'  # Default to count for unknown units

    def can_convert(self, from_unit: str, to_unit: str, ingredient: str = None) -> bool:
        """Check if two units can be converted between each other."""
        try:
            from_normalized = self.normalize_unit_name(from_unit)
            to_normalized = self.normalize_unit_name(to_unit)

            # Same unit category check
            from_category = self.get_unit_category(from_normalized)
            to_category = self.get_unit_category(to_normalized)

            # Allow volume-weight conversions for specific ingredients
            if ingredient and from_category != to_category:
                ingredient_lower = ingredient.lower()
                for ing_key in self.ingredient_conversions.keys():
                    if ing_key in ingredient_lower:
                        # Allow conversion between volume and weight for this ingredient
                        if (from_category == 'volume' and to_category == 'weight') or \
                           (from_category == 'weight' and to_category == 'volume'):
                            return True

            if from_category != to_category:
                return False

            # Try actual conversion
            from_qty = self.ureg.Quantity(1, from_normalized)
            to_qty = from_qty.to(to_normalized)
            return True
        except:
            return False

    def convert_quantity(self, quantity: float, from_unit: str, to_unit: str, ingredient: str = None) -> Optional[float]:
        """Convert quantity from one unit to another, with ingredient-specific conversions."""
        try:
            from_normalized = self.normalize_unit_name(from_unit)
            to_normalized = self.normalize_unit_name(to_unit)

            # Try ingredient-specific conversion first
            if ingredient and self._try_ingredient_conversion(quantity, from_normalized, to_normalized, ingredient.lower()):
                return self._try_ingredient_conversion(quantity, from_normalized, to_normalized, ingredient.lower())

            # Fall back to standard unit conversion
            from_qty = self.ureg.Quantity(quantity, from_normalized)
            to_qty = from_qty.to(to_normalized)
            result = float(to_qty.magnitude)

            # Round to reasonable precision
            if result < 0.01:
                return round(result, 4)
            elif result < 0.1:
                return round(result, 3)
            elif result < 1:
                return round(result, 2)
            else:
                return round(result, 1)
        except:
            return None

    def _try_ingredient_conversion(self, quantity: float, from_unit: str, to_unit: str, ingredient: str) -> Optional[float]:
        """Try ingredient-specific volume-weight conversions."""
        # Check if we have conversion data for this ingredient
        for ing_key, conversion_data in self.ingredient_conversions.items():
            if ing_key in ingredient:
                try:
                    # Convert through the ingredient's density
                    if from_unit == 'cup' and to_unit in ['ounce', 'pound']:
                        # Cup to weight
                        ounces = quantity * conversion_data['density_factor']
                        if to_unit == 'pound':
                            return round(ounces / 16, 2)
                        return round(ounces, 1)
                    elif from_unit in ['ounce', 'pound'] and to_unit == 'cup':
                        # Weight to cup
                        if from_unit == 'pound':
                            ounces = quantity * 16
                        else:
                            ounces = quantity
                        cups = ounces / conversion_data['density_factor']
                        return round(cups, 2)
                except:
                    pass
        return None

    def find_best_common_unit(self, units_list: List[str]) -> str:
        """Find the best common unit for a list of units."""
        if not units_list:
            return 'each'

        # If all units are the same, use that
        unique_units = list(set(self.normalize_unit_name(u) for u in units_list))
        if len(unique_units) == 1:
            return unique_units[0]

        # Find the category of the first unit
        first_category = self.get_unit_category(unique_units[0])

        # Check if all units are in the same category
        if all(self.get_unit_category(u) == first_category for u in unique_units):
            return self.output_preferences.get(first_category, unique_units[0])

        # If mixed categories, can't convert - return the first unit
        return units_list[0]

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

def generate_shopping_list(input_path: str, output_path: str, defaults: DataDefaults = None, enable_unit_conversion: bool = True):
    """Generate a consolidated shopping list from ingredient CSV with robust data validation and unit conversion."""
    if defaults is None:
        defaults = DataDefaults()

    validator = DataValidator(defaults)
    converter = UnitConverter() if enable_unit_conversion else None

    # First pass: collect all data without unit conversion
    raw_items = []

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

            raw_items.append(cleaned_row)

    # Second pass: group by location and ingredient, then handle unit conversion
    # Group items by (location, ingredient) first
    ingredient_groups = defaultdict(list)
    for item in raw_items:
        key = (item["location"], item["ingredient"])
        ingredient_groups[key].append(item)

    # Process each group with unit conversion
    totals = {}
    conversion_summary = []

    for (location, ingredient), items in ingredient_groups.items():
        if not enable_unit_conversion or len(items) == 1:
            # No conversion needed - just aggregate normally
            for item in items:
                key = (location, ingredient, item["units"])
                if key not in totals:
                    totals[key] = {"quantity": 0.0, "price": 0.0}
                totals[key]["quantity"] += item["quantity"]
                totals[key]["price"] += item["price"]
        else:
            # Try to convert units for this ingredient
            units_in_group = [item["units"] for item in items]
            best_unit = converter.find_best_common_unit(units_in_group)

            # Check if we can convert all items to the best unit
            convertible_items = []
            non_convertible_items = []

            for item in items:
                if item["units"] == best_unit or converter.can_convert(item["units"], best_unit, ingredient):
                    convertible_items.append(item)
                else:
                    non_convertible_items.append(item)

            # Convert and aggregate convertible items
            if convertible_items:
                converted_quantity = 0.0
                total_price = 0.0
                original_quantities = []

                for item in convertible_items:
                    if item["units"] == best_unit:
                        converted_qty = item["quantity"]
                    else:
                        converted_qty = converter.convert_quantity(item["quantity"], item["units"], best_unit, ingredient)
                        if converted_qty is None:
                            # Conversion failed, treat as non-convertible
                            non_convertible_items.append(item)
                            continue

                    converted_quantity += converted_qty
                    total_price += item["price"]
                    original_quantities.append(f"{item['quantity']} {item['units']}")

                if converted_quantity > 0:
                    key = (location, ingredient, best_unit)
                    totals[key] = {"quantity": converted_quantity, "price": total_price}

                    if len(convertible_items) > 1:
                        # Format the final quantity nicely
                        if converted_quantity == int(converted_quantity):
                            qty_str = f"{int(converted_quantity)}"
                        else:
                            qty_str = f"{converted_quantity:.2f}".rstrip('0').rstrip('.')

                        conversion_summary.append(
                            f"  ✓ {ingredient}: {' + '.join(original_quantities)} → "
                            f"{qty_str} {best_unit}"
                        )

            # Handle non-convertible items separately
            for item in non_convertible_items:
                key = (location, ingredient, item["units"])
                if key not in totals:
                    totals[key] = {"quantity": 0.0, "price": 0.0}
                totals[key]["quantity"] += item["quantity"]
                totals[key]["price"] += item["price"]

    # Print validation summary
    validator.print_summary()

    # Print conversion summary
    if enable_unit_conversion and conversion_summary:
        print(f"\nUnit Conversions Applied:")
        for conversion in conversion_summary:
            print(conversion)

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

    # Unit conversion options
    parser.add_argument(
        "--disable-unit-conversion", action="store_true",
        help="Disable automatic unit conversion (default: enabled)"
    )

    args = parser.parse_args()

    # Create custom defaults from command line arguments
    defaults = DataDefaults()
    defaults.quantity = args.default_quantity
    defaults.price = args.default_price
    defaults.location = args.default_location
    defaults.units = args.default_units
    defaults.ingredient = args.default_ingredient

    # Unit conversion is enabled by default, disabled if flag is set
    enable_conversion = not args.disable_unit_conversion

    generate_shopping_list(args.input_csv, args.output_csv, defaults, enable_conversion)

if __name__ == "__main__":
    main()
