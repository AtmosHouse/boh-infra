"""SQLAlchemy database models."""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class CourseType(str, enum.Enum):
    """Enum for meal course types."""

    APPETIZER = "appetizer"
    SOUP = "soup"
    SALAD = "salad"
    MAIN = "main"
    SIDE = "side"
    DESSERT = "dessert"
    BEVERAGE = "beverage"
    OTHER = "other"


class Store(Base):
    """A store where ingredients can be purchased."""

    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    ingredients: Mapped[list["Ingredient"]] = relationship(
        "Ingredient", back_populates="store"
    )

    def __repr__(self) -> str:
        return f"<Store(id={self.id}, name='{self.name}')>"


class Dish(Base):
    """A dish/recipe with a name and course type."""

    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    course: Mapped[CourseType] = mapped_column(
        Enum(
            CourseType,
            name="coursetype",
            values_callable=lambda e: [member.value for member in e],
        ),
        default=CourseType.MAIN,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    servings: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recipe_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    ingredient_instances: Mapped[list["IngredientInstance"]] = relationship(
        "IngredientInstance", back_populates="dish", cascade="all, delete-orphan"
    )
    shopping_items: Mapped[list["ShoppingListItem"]] = relationship(
        "ShoppingListItem", back_populates="dish", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Dish(id={self.id}, name='{self.name}', course='{self.course.value}')>"


class Ingredient(Base):
    """A base ingredient definition with name, store, and standard unit."""

    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    store_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("stores.id", ondelete="SET NULL"), nullable=True
    )
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="each")
    is_purchased: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    store: Mapped[Optional["Store"]] = relationship("Store", back_populates="ingredients")
    instances: Mapped[list["IngredientInstance"]] = relationship(
        "IngredientInstance", back_populates="ingredient", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Ingredient(id={self.id}, name='{self.name}')>"


class IngredientInstance(Base):
    """An instance of an ingredient used in a specific dish."""

    __tablename__ = "ingredient_instances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ingredient_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False
    )
    dish_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dishes.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    ingredient: Mapped["Ingredient"] = relationship("Ingredient", back_populates="instances")
    dish: Mapped["Dish"] = relationship("Dish", back_populates="ingredient_instances")

    def __repr__(self) -> str:
        return f"<IngredientInstance(id={self.id}, qty={self.quantity})>"


class ShoppingListItem(Base):
    """A shopping list item, optionally associated with a dish."""

    __tablename__ = "shopping_list_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dish_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("dishes.id", ondelete="SET NULL"), nullable=True
    )
    ingredient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    dish: Mapped[Optional["Dish"]] = relationship("Dish", back_populates="shopping_items")

    def __repr__(self) -> str:
        return f"<ShoppingListItem(id={self.id}, name='{self.ingredient_name}', checked={self.is_checked})>"


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
