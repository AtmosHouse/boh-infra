"""API routes for user management and RSVP."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User
from app.models import (
    PlusOneCreate,
    RSVPListResponse,
    RSVPResponse,
    UserCreate,
    UserPublicResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)) -> list[UserResponse]:
    """List all users."""
    result = await db.execute(select(User).order_by(User.last_name, User.first_name))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Create a new user."""
    user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        original_invitee_id=user_data.original_invitee_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/rsvp-list", response_model=RSVPListResponse)
async def get_rsvp_list(db: AsyncSession = Depends(get_db)) -> RSVPListResponse:
    """Get list of all RSVP'd users (public endpoint for invite page)."""
    result = await db.execute(
        select(User)
        .where(User.has_rsvped == True)  # noqa: E712
        .order_by(User.rsvped_at)
    )
    users = result.scalars().all()

    # Get total count of all users
    total_result = await db.execute(select(User))
    all_users = total_result.scalars().all()

    public_users = [
        UserPublicResponse(
            id=u.id,
            first_name=u.first_name,
            last_name=u.last_name,
            has_rsvped=u.has_rsvped,
            rsvped_at=u.rsvped_at,
            is_plus_one=u.original_invitee_id is not None,
        )
        for u in users
    ]

    return RSVPListResponse(
        users=public_users,
        total=len(all_users),
        total_rsvped=len(users),
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Get a user by ID (used for magic link validation)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/{user_id}/rsvp", response_model=RSVPResponse)
async def rsvp(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> RSVPResponse:
    """RSVP for the event."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.has_rsvped:
        return RSVPResponse(
            success=True,
            message=f"You've already RSVP'd, {user.first_name}! See you there! 🎄",
            user=UserResponse.model_validate(user),
        )

    user.has_rsvped = True
    user.rsvped_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    return RSVPResponse(
        success=True,
        message=f"You're in, {user.first_name}! Can't wait to see you! 🎉",
        user=UserResponse.model_validate(user),
    )


@router.get("/{user_id}/plus-one", response_model=UserResponse | None)
async def get_plus_one(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> UserResponse | None:
    """Get a user's plus one if they have one."""
    result = await db.execute(
        select(User).where(User.original_invitee_id == user_id)
    )
    plus_one = result.scalar_one_or_none()
    if not plus_one:
        return None
    return UserResponse.model_validate(plus_one)


@router.post("/{user_id}/plus-one", response_model=UserResponse, status_code=201)
async def add_plus_one(
    user_id: int,
    plus_one_data: PlusOneCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Add a plus one for a user."""
    # Verify the original invitee exists
    result = await db.execute(select(User).where(User.id == user_id))
    original_user = result.scalar_one_or_none()
    if not original_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user already has a plus one
    existing_plus_one = await db.execute(
        select(User).where(User.original_invitee_id == user_id)
    )
    if existing_plus_one.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have a plus one")

    # Create the plus one
    plus_one = User(
        first_name=plus_one_data.first_name,
        last_name=plus_one_data.last_name,
        original_invitee_id=user_id,
        has_rsvped=True,
        rsvped_at=datetime.now(timezone.utc),
    )
    db.add(plus_one)
    await db.commit()
    await db.refresh(plus_one)
    return UserResponse.model_validate(plus_one)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()

