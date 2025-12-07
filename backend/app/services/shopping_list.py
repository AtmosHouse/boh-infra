"""Shopping list generation service."""

from collections import defaultdict
from typing import Any

from app.models.shopping import ConsolidatedItem, ShoppingItem
from app.services.data_validator import DataDefaults, DataValidator
from app.services.unit_converter import UnitConverter


class ShoppingListService:
    """Service for generating consolidated shopping lists."""

    def __init__(
        self,
        defaults: DataDefaults | None = None,
        enable_unit_conversion: bool = True,
    ):
        self.defaults = defaults or DataDefaults()
        self.enable_unit_conversion = enable_unit_conversion
        self.validator = DataValidator(self.defaults)
        self.converter = UnitConverter() if enable_unit_conversion else None
        self.conversion_summary: list[str] = []

    def generate(self, items: list[ShoppingItem]) -> list[ConsolidatedItem]:
        """Generate consolidated shopping list from ingredient items."""
        # Convert items to row format for validation
        raw_items = []
        for i, item in enumerate(items, start=1):
            row = {
                "ingredient": item.ingredient,
                "quantity": item.quantity,
                "units": item.units,
                "location": item.location,
                "price": item.price,
                "done": str(item.done).lower(),
            }
            cleaned = self.validator.validate_row(row, i)
            if cleaned is not None and not cleaned["done"]:
                raw_items.append(cleaned)

        # Group by location and ingredient
        ingredient_groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
        for item in raw_items:
            key = (item["location"], item["ingredient"])
            ingredient_groups[key].append(item)

        # Process each group with unit conversion
        totals: dict[tuple[str, str, str], dict[str, float]] = {}
        self.conversion_summary = []

        for (location, ingredient), group_items in ingredient_groups.items():
            if not self.enable_unit_conversion or len(group_items) == 1:
                self._aggregate_without_conversion(totals, group_items, location, ingredient)
            else:
                self._aggregate_with_conversion(totals, group_items, location, ingredient)

        # Convert to response format
        result = []
        for (loc, ing, unit), vals in sorted(totals.items()):
            result.append(
                ConsolidatedItem(
                    location=loc,
                    ingredient=ing,
                    quantity=vals["quantity"],
                    units=unit,
                    price=vals["price"],
                )
            )

        return result

    def _aggregate_without_conversion(
        self,
        totals: dict[tuple[str, str, str], dict[str, float]],
        items: list[dict[str, Any]],
        location: str,
        ingredient: str,
    ) -> None:
        """Aggregate items without unit conversion."""
        for item in items:
            key = (location, ingredient, item["units"])
            if key not in totals:
                totals[key] = {"quantity": 0.0, "price": 0.0}
            totals[key]["quantity"] += item["quantity"]
            totals[key]["price"] += item["price"]

    def _aggregate_with_conversion(
        self,
        totals: dict[tuple[str, str, str], dict[str, float]],
        items: list[dict[str, Any]],
        location: str,
        ingredient: str,
    ) -> None:
        """Aggregate items with unit conversion."""
        units_in_group = [item["units"] for item in items]
        best_unit = self.converter.find_best_common_unit(units_in_group)

        convertible_items = []
        non_convertible_items = []

        for item in items:
            if item["units"] == best_unit or self.converter.can_convert(
                item["units"], best_unit, ingredient
            ):
                convertible_items.append(item)
            else:
                non_convertible_items.append(item)

        if convertible_items:
            self._process_convertible_items(
                totals, convertible_items, non_convertible_items,
                location, ingredient, best_unit,
            )

        for item in non_convertible_items:
            key = (location, ingredient, item["units"])
            if key not in totals:
                totals[key] = {"quantity": 0.0, "price": 0.0}
            totals[key]["quantity"] += item["quantity"]
            totals[key]["price"] += item["price"]

    def _process_convertible_items(
        self,
        totals: dict[tuple[str, str, str], dict[str, float]],
        convertible_items: list[dict[str, Any]],
        non_convertible_items: list[dict[str, Any]],
        location: str,
        ingredient: str,
        best_unit: str,
    ) -> None:
        """Process items that can be converted to a common unit."""
        converted_quantity = 0.0
        total_price = 0.0
        original_quantities = []

        for item in convertible_items:
            if item["units"] == best_unit:
                converted_qty = item["quantity"]
            else:
                converted_qty = self.converter.convert_quantity(
                    item["quantity"], item["units"], best_unit, ingredient
                )
                if converted_qty is None:
                    non_convertible_items.append(item)
                    continue

            converted_quantity += converted_qty
            total_price += item["price"]
            original_quantities.append(f"{item['quantity']} {item['units']}")

        if converted_quantity > 0:
            key = (location, ingredient, best_unit)
            totals[key] = {"quantity": converted_quantity, "price": total_price}

            if len(original_quantities) > 1:
                qty_str = (
                    str(int(converted_quantity))
                    if converted_quantity == int(converted_quantity)
                    else f"{converted_quantity:.2f}".rstrip("0").rstrip(".")
                )
                self.conversion_summary.append(
                    f"{ingredient}: {' + '.join(original_quantities)} → {qty_str} {best_unit}"
                )

    def get_warnings(self) -> list[dict[str, Any]]:
        """Get validation warnings."""
        return [w.model_dump() for w in self.validator.warnings]

    def get_conversions(self) -> list[str]:
        """Get list of unit conversions applied."""
        return self.conversion_summary
