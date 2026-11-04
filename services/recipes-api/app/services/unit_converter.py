"""Unit conversion service for cooking ingredients."""

from typing import Optional

import pint


class UnitConverter:
    """Handles unit conversions for cooking ingredients."""

    def __init__(self):
        self.ureg = pint.UnitRegistry()
        # Define common cooking unit aliases
        self.ureg.define("each = 1 * dimensionless")
        self.ureg.define("clove = 1 * dimensionless")
        self.ureg.define("head = 1 * dimensionless")
        self.ureg.define("bunch = 1 * dimensionless")
        self.ureg.define("package = 1 * dimensionless")
        self.ureg.define("container = 1 * dimensionless")
        self.ureg.define("bottle = 1 * dimensionless")
        self.ureg.define("loaf = 1 * dimensionless")
        # Define stick of butter as 4 oz (standard US measurement)
        self.ureg.define("stick = 4 * ounce")

        # Define preferred units for different categories
        self.preferred_units = {
            "volume": [
                "cup", "cups", "tablespoon", "tablespoons",
                "teaspoon", "teaspoons", "fluid_ounce", "fluid_ounces",
            ],
            "weight": [
                "pound", "pounds", "ounce", "ounces",
                "gram", "grams", "kilogram", "kilograms", "stick",
            ],
            "count": [
                "each", "clove", "head", "bunch",
                "package", "container", "bottle", "loaf",
            ],
        }

        # Common ingredient conversions (volume to weight)
        self.ingredient_conversions = {
            "sugar": {"cup": "7.05 ounce", "density_factor": 7.05},
            "flour": {"cup": "4.25 ounce", "density_factor": 4.25},
            "butter": {"cup": "8 ounce", "density_factor": 8.0},
        }

        # Unit preferences for output
        self.output_preferences = {
            "volume": "cup",
            "weight": "pound",
            "count": "each",
        }

    def normalize_unit_name(self, unit_str: str) -> str:
        """Normalize unit names to standard forms."""
        unit_str = unit_str.lower().strip()

        unit_mappings = {
            "lb": "pound", "lbs": "pound", "pounds": "pound",
            "oz": "ounce", "ounces": "ounce",
            "c": "cup", "cups": "cup",
            "tbsp": "tablespoon", "tablespoons": "tablespoon", "tbs": "tablespoon",
            "tsp": "teaspoon", "teaspoons": "teaspoon", "ts": "teaspoon",
            "fl oz": "fluid_ounce", "fluid oz": "fluid_ounce", "fl_oz": "fluid_ounce",
            "g": "gram", "grams": "gram",
            "kg": "kilogram", "kilograms": "kilogram",
        }

        return unit_mappings.get(unit_str, unit_str)

    def get_unit_category(self, unit_str: str) -> str:
        """Determine the category of a unit (volume, weight, count)."""
        normalized = self.normalize_unit_name(unit_str)

        for category, units in self.preferred_units.items():
            if normalized in units:
                return category

        return "count"

    def can_convert(self, from_unit: str, to_unit: str, ingredient: str | None = None) -> bool:
        """Check if two units can be converted between each other."""
        try:
            from_normalized = self.normalize_unit_name(from_unit)
            to_normalized = self.normalize_unit_name(to_unit)

            from_category = self.get_unit_category(from_normalized)
            to_category = self.get_unit_category(to_normalized)

            if ingredient and from_category != to_category:
                ingredient_lower = ingredient.lower()
                for ing_key in self.ingredient_conversions.keys():
                    if ing_key in ingredient_lower:
                        if (from_category == "volume" and to_category == "weight") or \
                           (from_category == "weight" and to_category == "volume"):
                            return True

            if from_category != to_category:
                return False

            from_qty = self.ureg.Quantity(1, from_normalized)
            from_qty.to(to_normalized)
            return True
        except Exception:
            return False

    def convert_quantity(
        self,
        quantity: float,
        from_unit: str,
        to_unit: str,
        ingredient: str | None = None,
    ) -> Optional[float]:
        """Convert quantity from one unit to another."""
        try:
            from_normalized = self.normalize_unit_name(from_unit)
            to_normalized = self.normalize_unit_name(to_unit)

            # Same unit, no conversion needed
            if from_normalized == to_normalized:
                return quantity

            # Try ingredient-specific conversion (volume <-> weight)
            ing_result = self._try_ingredient_conversion(
                quantity, from_normalized, to_normalized, ingredient.lower() if ingredient else ""
            )
            if ing_result is not None:
                return ing_result

            # Standard unit conversion using pint
            from_qty = self.ureg.Quantity(quantity, from_normalized)
            to_qty = from_qty.to(to_normalized)
            result = float(to_qty.magnitude)

            return self._round_result(result)
        except Exception:
            return None

    def _try_ingredient_conversion(
        self,
        quantity: float,
        from_unit: str,
        to_unit: str,
        ingredient: str,
    ) -> Optional[float]:
        """Try ingredient-specific volume-weight conversions."""
        for ing_key, conversion_data in self.ingredient_conversions.items():
            if ing_key in ingredient:
                try:
                    # First convert both units to base units (cups for volume, ounces for weight)
                    from_category = self.get_unit_category(from_unit)
                    to_category = self.get_unit_category(to_unit)

                    if from_category == "volume" and to_category == "weight":
                        # Convert source to cups first
                        cups = self.ureg.Quantity(quantity, from_unit).to("cup").magnitude
                        ounces = cups * conversion_data["density_factor"]
                        result = self.ureg.Quantity(ounces, "ounce").to(to_unit).magnitude
                        return self._round_result(result)
                    elif from_category == "weight" and to_category == "volume":
                        # Convert source to ounces first
                        ounces = self.ureg.Quantity(quantity, from_unit).to("ounce").magnitude
                        cups = ounces / conversion_data["density_factor"]
                        result = self.ureg.Quantity(cups, "cup").to(to_unit).magnitude
                        return self._round_result(result)
                except Exception:
                    pass
        return None

    def _round_result(self, result: float) -> float:
        """Round result to appropriate precision."""
        if result < 0.01:
            return round(result, 4)
        elif result < 0.1:
            return round(result, 3)
        elif result < 1:
            return round(result, 2)
        else:
            return round(result, 2)

    def find_best_common_unit(self, units_list: list[str]) -> str:
        """Find the best common unit for a list of units."""
        if not units_list:
            return "each"

        unique_units = list(set(self.normalize_unit_name(u) for u in units_list))
        if len(unique_units) == 1:
            return unique_units[0]

        first_category = self.get_unit_category(unique_units[0])

        if all(self.get_unit_category(u) == first_category for u in unique_units):
            return self.output_preferences.get(first_category, unique_units[0])

        return units_list[0]

