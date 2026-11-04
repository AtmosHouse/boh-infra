"""Unit normalization service for consistent ingredient measurements."""

from typing import Optional


# Standard unit mappings (various spellings -> canonical form)
UNIT_ALIASES: dict[str, str] = {
    # Volume - small
    "tsp": "teaspoon",
    "tsps": "teaspoon",
    "teaspoons": "teaspoon",
    "t": "teaspoon",
    "tbsp": "tablespoon",
    "tbsps": "tablespoon",
    "tablespoons": "tablespoon",
    "T": "tablespoon",
    "tbs": "tablespoon",
    # Volume - medium
    "c": "cup",
    "cups": "cup",
    "C": "cup",
    # Volume - large
    "pt": "pint",
    "pints": "pint",
    "qt": "quart",
    "quarts": "quart",
    "gal": "gallon",
    "gallons": "gallon",
    # Volume - metric
    "ml": "milliliter",
    "mls": "milliliter",
    "milliliters": "milliliter",
    "l": "liter",
    "liters": "liter",
    "L": "liter",
    # Weight - imperial
    "oz": "ounce",
    "ozs": "ounce",
    "ounces": "ounce",
    "lb": "pound",
    "lbs": "pound",
    "pounds": "pound",
    # Weight - metric
    "g": "gram",
    "grams": "gram",
    "kg": "kilogram",
    "kilograms": "kilogram",
    "kgs": "kilogram",
    # Count
    "ea": "each",
    "pc": "each",
    "pcs": "each",
    "piece": "each",
    "pieces": "each",
    # Produce units
    "head": "head",
    "heads": "head",
    "bunch": "bunch",
    "bunches": "bunch",
    "clove": "clove",
    "cloves": "clove",
    "sprig": "sprig",
    "sprigs": "sprig",
    "stalk": "stalk",
    "stalks": "stalk",
    # Other
    "pinch": "pinch",
    "pinches": "pinch",
    "dash": "dash",
    "dashes": "dash",
    "can": "can",
    "cans": "can",
    "package": "package",
    "packages": "package",
    "pkg": "package",
    "pkgs": "package",
    "slice": "slice",
    "slices": "slice",
    "stick": "stick",
    "sticks": "stick",
}

# Canonical units list (the normalized forms)
CANONICAL_UNITS = sorted(set(UNIT_ALIASES.values()))


class UnitNormalizer:
    """Service for normalizing ingredient units."""

    @staticmethod
    def normalize(unit: Optional[str]) -> str:
        """
        Normalize a unit string to its canonical form.
        
        Args:
            unit: The unit string to normalize (e.g., "tbsp", "lbs", "ozs")
            
        Returns:
            The canonical unit form (e.g., "tablespoon", "pound", "ounce")
            Returns "each" for None or unrecognized units
        """
        if not unit:
            return "each"
        
        unit_lower = unit.lower().strip()
        
        # Direct lookup
        if unit_lower in UNIT_ALIASES:
            return UNIT_ALIASES[unit_lower]
        
        # Check if it's already a canonical unit
        if unit_lower in CANONICAL_UNITS:
            return unit_lower
        
        # Return as-is if not recognized (preserves custom units)
        return unit_lower if unit_lower else "each"

    @staticmethod
    def get_canonical_units() -> list[str]:
        """Return list of all canonical units."""
        return CANONICAL_UNITS.copy()


# Singleton instance
unit_normalizer = UnitNormalizer()

