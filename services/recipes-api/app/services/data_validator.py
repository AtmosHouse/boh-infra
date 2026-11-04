"""Data validation service for ingredient data."""

from typing import Any

from pydantic import BaseModel, Field


class DataDefaults(BaseModel):
    """Configuration class for default values when data is missing."""

    quantity: float = Field(1.0, description="Default quantity")
    price: float = Field(0.0, description="Default price")
    location: str = Field("Unknown", description="Default location")
    units: str = Field("each", description="Default units")
    ingredient: str = Field("Unknown Item", description="Default ingredient name")


class ValidationWarning(BaseModel):
    """A validation warning message."""

    row: int
    message: str


class DataValidator:
    """Handles data validation and provides warnings for missing/invalid data."""

    def __init__(self, defaults: DataDefaults | None = None):
        self.defaults = defaults or DataDefaults()
        self.warnings: list[ValidationWarning] = []
        self.row_count = 0
        self.skipped_rows = 0

    def validate_row(self, row: dict[str, str], row_num: int) -> dict[str, Any] | None:
        """Validate and clean a single row of data."""
        self.row_count += 1
        cleaned_row = {}
        has_critical_missing = False

        # Validate ingredient (critical field)
        ingredient = row.get("Ingredient", row.get("ingredient", "")).strip()
        if not ingredient:
            self.warnings.append(ValidationWarning(row=row_num, message="Missing ingredient name"))
            ingredient = self.defaults.ingredient
            has_critical_missing = True
        cleaned_row["ingredient"] = ingredient

        # Validate location
        location = row.get("Location", row.get("location", "")).strip()
        if not location:
            self.warnings.append(
                ValidationWarning(row=row_num, message=f"Missing location, using '{self.defaults.location}'")
            )
            location = self.defaults.location
        cleaned_row["location"] = location

        # Validate quantity
        qty_str = str(row.get("Qty", row.get("qty", row.get("quantity", "")))).strip()
        try:
            quantity = float(qty_str) if qty_str else self.defaults.quantity
            if quantity < 0:
                self.warnings.append(
                    ValidationWarning(row=row_num, message=f"Negative quantity ({quantity}), using default")
                )
                quantity = self.defaults.quantity
        except ValueError:
            self.warnings.append(
                ValidationWarning(
                    row=row_num, message=f"Invalid quantity '{qty_str}', using default ({self.defaults.quantity})"
                )
            )
            quantity = self.defaults.quantity
        cleaned_row["quantity"] = quantity

        # Validate units
        units = row.get("Units", row.get("units", "")).strip()
        if not units:
            self.warnings.append(
                ValidationWarning(row=row_num, message=f"Missing units, using '{self.defaults.units}'")
            )
            units = self.defaults.units
        cleaned_row["units"] = units

        # Validate price
        price_str = str(row.get("Price", row.get("price", ""))).strip()
        try:
            price = float(price_str) if price_str else self.defaults.price
            if price < 0:
                self.warnings.append(
                    ValidationWarning(row=row_num, message=f"Negative price ({price}), using default")
                )
                price = self.defaults.price
        except ValueError:
            self.warnings.append(
                ValidationWarning(
                    row=row_num, message=f"Invalid price '{price_str}', using default ({self.defaults.price})"
                )
            )
            price = self.defaults.price
        cleaned_row["price"] = price

        # Check "Done?" field
        done = str(row.get("Done?", row.get("done", ""))).strip().lower()
        cleaned_row["done"] = done in ("1", "true", "yes")

        # Skip rows with critical missing data
        if has_critical_missing and ingredient == self.defaults.ingredient:
            self.warnings.append(
                ValidationWarning(row=row_num, message="Skipping row due to missing critical data")
            )
            self.skipped_rows += 1
            return None

        return cleaned_row

    def get_summary(self) -> dict[str, Any]:
        """Get a summary of data validation results."""
        return {
            "total_rows_processed": self.row_count,
            "rows_skipped": self.skipped_rows,
            "warnings_count": len(self.warnings),
            "warnings": [w.model_dump() for w in self.warnings],
        }

