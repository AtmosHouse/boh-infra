"""SQLAlchemy database models."""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class User(Base):
    """A user for the RSVP invite system."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4())
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    has_rsvped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    original_invitee_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    rsvped_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Self-referential relationship for plus-ones
    original_invitee: Mapped[Optional["User"]] = relationship(
        "User", remote_side=[id], backref="plus_ones"
    )

    # Relationship to chat messages
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        name = f"{self.first_name} {self.last_name}"
        return f"<User(id={self.id}, name='{name}', rsvped={self.has_rsvped})>"


class ChatMessage(Base):
    """A chat message posted by a user."""

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship to user
    user: Mapped["User"] = relationship("User", back_populates="chat_messages")

    def __repr__(self) -> str:
        preview = self.message[:50] + "..." if len(self.message) > 50 else self.message
        return f"<ChatMessage(id={self.id}, user_id={self.user_id}, message='{preview}')>"
