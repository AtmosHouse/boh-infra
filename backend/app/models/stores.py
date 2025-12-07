"""Pydantic models for stores."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StoreBase(BaseModel):
    """Base store model."""

    name: str


class StoreCreate(StoreBase):
    """Model for creating a store."""

    pass


class StoreUpdate(BaseModel):
    """Model for updating a store."""

    name: str | None = None


class StoreResponse(StoreBase):
    """Response model for a store."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class StoreListResponse(BaseModel):
    """Response model for list of stores."""

    stores: list[StoreResponse]
    total: int

