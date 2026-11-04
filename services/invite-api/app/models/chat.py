"""Pydantic models for chat messages."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChatMessageCreate(BaseModel):
    """Model for creating a chat message."""

    message: str


class ChatMessageResponse(BaseModel):
    """Response model for a chat message."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    message: str
    created_at: datetime
    # Include user info for display
    user_first_name: str
    user_last_name: str


class ChatListResponse(BaseModel):
    """Response model for list of chat messages."""

    messages: list[ChatMessageResponse]
    total: int

