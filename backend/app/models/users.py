"""Pydantic models for users and RSVP."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    """Base user model."""

    first_name: str
    last_name: str


class UserCreate(UserBase):
    """Model for creating a user."""

    original_invitee_id: int | None = None


class UserUpdate(BaseModel):
    """Model for updating a user."""

    first_name: str | None = None
    last_name: str | None = None


class UserResponse(UserBase):
    """Response model for a user."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    has_rsvped: bool
    original_invitee_id: int | None = None
    created_at: datetime
    rsvped_at: datetime | None = None


class UserPublicResponse(BaseModel):
    """Public response model for a user (for RSVP list)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    has_rsvped: bool
    rsvped_at: datetime | None = None
    is_plus_one: bool = False


class RSVPListResponse(BaseModel):
    """Response model for list of RSVP'd users."""

    users: list[UserPublicResponse]
    total: int
    total_rsvped: int


class RSVPResponse(BaseModel):
    """Response model for RSVP action."""

    success: bool
    message: str
    user: UserResponse


class PlusOneCreate(BaseModel):
    """Model for adding a plus one."""

    first_name: str
    last_name: str

