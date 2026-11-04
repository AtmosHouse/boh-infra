"""Unified shopping list aggregation.

Consolidates dish-derived ingredient usage and standalone manual items into
a single shopping list. All quantity math goes through UnitConverter so
mixed-unit contributions (e.g. "2 cups" + "8 ounces" of flour) merge into
each ingredient's base unit.
"""

from dataclasses import dataclass, field
from typing import Optional

from app.db.models import Dish, ShoppingListItem
from app.services.unit_converter import UnitConverter
from app.services.unit_normalizer import unit_normalizer

MANUAL_DISH_NAME = "Manual entry"


@dataclass
class Contribution:
    """One dish usage or manual entry feeding a line item."""

    instance_id: Optional[int] = None
    item_id: Optional[int] = None
    dish_id: Optional[int] = None
    dish_name: str = ""
    quantity: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class LineItem:
    """A consolidated shopping list row."""

    key: str
    name: str
    ingredient_id: Optional[int] = None
    item_id: Optional[int] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    store_id: Optional[int] = None
    is_done: bool = False
    has_dish_items: bool = False
    contributions: list[Contribution] = field(default_factory=list)


def _format_qty(qty: float) -> str:
    """Format a quantity for the conversion summary."""
    if qty == int(qty):
        return str(int(qty))
    return f"{qty:.2f}".rstrip("0").rstrip(".")


def _ingredient_line(lines: dict[str, LineItem], ing, unit: str) -> LineItem:
    """Get or create the line for an ingredient, keyed per unit when a
    contribution can't be merged into the base unit."""
    key = f"ingredient:{ing.id}" if unit == ing.unit else f"ingredient:{ing.id}:{unit}"
    if key not in lines:
        lines[key] = LineItem(
            key=key,
            ingredient_id=ing.id,
            name=ing.name,
            quantity=0.0,
            unit=unit,
            store_id=ing.store_id,
            is_done=ing.is_purchased,
        )
    return lines[key]


def consolidate(
    dishes: list[Dish],
    manual_items: list[ShoppingListItem],
    converter: UnitConverter | None = None,
) -> tuple[list[LineItem], list[str]]:
    """Merge dish ingredient instances and manual items into line items.

    Returns (line_items, conversions_applied). Line items are sorted by name.
    """
    converter = converter or UnitConverter()
    lines: dict[str, LineItem] = {}
    conversions: list[str] = []

    # --- Dish-derived contributions -------------------------------------
    for dish in dishes:
        for inst in dish.ingredient_instances:
            ing = inst.ingredient
            inst_unit = unit_normalizer.normalize(inst.unit)
            qty = inst.quantity

            if inst_unit != ing.unit:
                converted = converter.convert_quantity(qty, inst_unit, ing.unit, ing.name)
                if converted is not None:
                    conversions.append(
                        f"{ing.name}: {_format_qty(qty)} {inst_unit} "
                        f"→ {_format_qty(converted)} {ing.unit}"
                    )
                    qty = converted
                    inst_unit = ing.unit
                # else: falls through to a separate per-unit line

            line = _ingredient_line(lines, ing, inst_unit)
            line.has_dish_items = True
            line.quantity = (line.quantity or 0.0) + qty
            line.contributions.append(
                Contribution(
                    instance_id=inst.id,
                    dish_id=dish.id,
                    dish_name=dish.name,
                    quantity=inst.quantity,
                    unit=unit_normalizer.normalize(inst.unit),
                    notes=inst.notes,
                )
            )

    # --- Manual items ----------------------------------------------------
    for item in manual_items:
        item_unit = unit_normalizer.normalize(item.unit)
        dish_name = item.dish.name if item.dish else MANUAL_DISH_NAME
        contribution = Contribution(
            item_id=item.id,
            dish_id=item.dish_id,
            dish_name=dish_name,
            quantity=item.quantity,
            unit=item_unit,
            notes=item.notes,
        )

        match = _find_ingredient_line(lines, item.ingredient_name)
        if match is not None:
            qty = item.quantity
            if qty is not None and item_unit != match.unit:
                converted = converter.convert_quantity(qty, item_unit, match.unit, match.name)
                if converted is not None:
                    conversions.append(
                        f"{match.name}: {_format_qty(qty)} {item_unit} "
                        f"→ {_format_qty(converted)} {match.unit}"
                    )
                    qty = converted
                else:
                    match = None  # can't merge; becomes a standalone line
            if match is not None:
                match.quantity = (match.quantity or 0.0) + (qty or 0.0)
                match.contributions.append(contribution)
                continue

        lines[f"item:{item.id}"] = LineItem(
            key=f"item:{item.id}",
            item_id=item.id,
            name=item.ingredient_name.strip().lower(),
            quantity=item.quantity,
            unit=item_unit if item.quantity is not None else item.unit,
            store_id=item.store_id,
            is_done=item.is_checked,
            contributions=[contribution],
        )

    return sorted(lines.values(), key=lambda l: l.name), conversions


def _find_ingredient_line(
    lines: dict[str, LineItem], name: str
) -> Optional[LineItem]:
    """Find a base-unit ingredient line matching the name (case-insensitive)."""
    needle = name.strip().lower()
    for line in lines.values():
        if line.key.count(":") == 1 and line.ingredient_id is not None and line.name == needle:
            return line
    return None
